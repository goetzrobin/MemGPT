import { Badge } from '@memgpt/components/badge';
import React, { useEffect, useRef } from 'react';
import { Agent } from '../../../libs/agents/agent';
import { Message } from '../../../libs/messages/message';
import { ReadyState } from '../../../libs/messages/message-stream.store';
import MessageContainerLayout from './message-container-layout';
import { pickMessageElement } from './message/pick-message-element';
import SelectAgentForm from './select-agent-form';
import ThinkingIndicator from './thinking-indicator';

const MessageContainer = ({
	fetchPreviousSection,
	currentAgent,
	messages,
	readyState,
	previousMessages,
}: {
	fetchPreviousSection: React.ReactNode;
	currentAgent: Agent | null;
	messages: Message[];
	readyState: ReadyState;
	previousMessages: Message[];
}) => {
	const messageBox = useRef<HTMLDivElement>(null);
	useEffect(() => messageBox.current?.scrollIntoView(false), [messages]);

	if (!currentAgent) {
		return (
			<MessageContainerLayout>
				<SelectAgentForm />
			</MessageContainerLayout>
		);
	}

	return (
		<MessageContainerLayout>
			<div className="sticky top-2 z-10 mx-auto flex w-full flex-col items-center justify-center">
				<Badge className="mb-4 bg-background" variant="outline">
					{currentAgent.name}
				</Badge>
				{fetchPreviousSection}
			</div>

			<div className="flex flex-1 flex-col space-y-4 px-4 py-6" ref={messageBox}>
				{previousMessages.map((message, i) => pickMessageElement(message, i))}
				{messages.map((message, i) => pickMessageElement(message, i))}
				{readyState === ReadyState.LOADING ? <ThinkingIndicator className="flex items-center py-3 px-3" /> : undefined}
			</div>
		</MessageContainerLayout>
	);
};

export default MessageContainer;
