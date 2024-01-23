import { Button } from '@memgpt/components/button';
import { useCallback, useEffect, useRef } from 'react';
import { useAgentActions, useCurrentAgent, useLastAgentInitMessage } from '../../libs/agents/agent.store';
import { useAuthStoreState } from '../../libs/auth/auth.store';
import { Message } from '../../libs/messages/message';
import { useMessageHistoryActions, useMessagesForKey } from '../../libs/messages/message-history.store';
import {
	ReadyState,
	useMessageSocketActions,
	useMessageStreamReadyState,
} from '../../libs/messages/message-stream.store';
import { useMessagesQuery } from '../../libs/messages/use-messages.query';
import MessageContainer from './messages/message-container';
import UserInput from './user-input';

const Chat = () => {
	const initialized = useRef(false);
	const auth = useAuthStoreState();
	const currentAgent = useCurrentAgent();
	const lastAgentInitMessage = useLastAgentInitMessage();
	const messages = useMessagesForKey(currentAgent?.id);
	const {
		data: messageFromApi,
		fetchPreviousPage,
		hasPreviousPage,
		isFetchingPreviousPage,
	} = useMessagesQuery(auth.uuid, currentAgent?.id);

	const readyState = useMessageStreamReadyState();
	const { sendMessage } = useMessageSocketActions();
	const { addMessage } = useMessageHistoryActions();
	const { setLastAgentInitMessage } = useAgentActions();

	const sendMessageAndAddToHistory = useCallback(
		(message: string, role: 'user' | 'system' = 'user') => {
			if (!currentAgent || !auth.uuid) return;
			const date = new Date();
			sendMessage({ userId: auth.uuid, agentId: currentAgent.id, message, role });
			addMessage(currentAgent.id, {
				type: role === 'user' ? 'user_message' : 'system_message',
				message_type: 'user_message',
				message,
				date,
			});
		},
		[currentAgent, auth.uuid, sendMessage, addMessage]
	);

	useEffect(() => {
		if (!initialized.current) {
			initialized.current = true;
			setTimeout(() => {
				if (!currentAgent) return null;
				if (messages.length === 0 || lastAgentInitMessage?.agentId !== currentAgent.id) {
					setLastAgentInitMessage({ date: new Date(), agentId: currentAgent.id });
					sendMessageAndAddToHistory(
						'The user is back! Lets pick up the conversation! Reflect on the previous conversation and use your function calling to send him a friendly message.',
						'system'
					);
				}
			}, 300);
		}
		return () => {
			initialized.current = true;
		};
	}, [
		currentAgent,
		lastAgentInitMessage?.agentId,
		messages.length,
		sendMessageAndAddToHistory,
		setLastAgentInitMessage,
	]);

	const previousMessages: Message[] = (messageFromApi?.pages ?? []).flatMap((p, pi) =>
		[...p.messages].reverse().flatMap((m) => parseMessage(m))
	);

	return (
		<div className="mx-auto max-w-screen-xl p-4">
			<MessageContainer
				fetchPreviousSection={
					<Button size="sm" onClick={() => fetchPreviousPage()} disabled={!hasPreviousPage || isFetchingPreviousPage}>
						{isFetchingPreviousPage ? 'Loading more...' : hasPreviousPage ? 'Load Older' : 'Nothing more to load'}
					</Button>
				}
				currentAgent={currentAgent}
				readyState={readyState}
				previousMessages={previousMessages}
				messages={messages}
			/>
			<UserInput enabled={readyState !== ReadyState.LOADING} onSend={sendMessageAndAddToHistory} />
		</div>
	);
};

const parseMessage = (m: any): Message[] => {
	const messages: Message[] = [];
	const messageToUser = JSON.parse(m.tool_calls?.[0]?.function?.arguments ?? '{}').message;
	// role - tool,user,assistant
	// name - tool has names -> send_message

	if (m.role === 'user' && JSON.parse(m.text).type === 'user_message') {
		messages.push({
			id: m.id,
			type: 'user_message',
			message_type: 'user_message',
			message: JSON.parse(m.text).message,
			date: new Date(m.created_at),
		});
	}
	if (m.role === 'assistant') {
		messages.push({
			id: m.id,
			type: 'agent_response',
			message_type: 'internal_monologue',
			message: m.text,
			date: new Date(m.created_at),
		});
	}
	if (m.role === 'assistant' && messageToUser) {
		messages.push({
			id: m.id,
			type: 'agent_response',
			message_type: 'assistant_message',
			message: messageToUser,
			date: new Date(m.created_at),
		});
	}
	return messages;
};
export default Chat;
