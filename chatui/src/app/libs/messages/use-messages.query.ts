import { useInfiniteQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../constants';
import { Message } from './message';

export const useMessagesQuery = (userId: string | null | undefined, agentId: string | null | undefined) =>
	useInfiniteQuery({
		queryKey: [userId, 'agents', 'item', agentId, 'messages', 'list'],
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam }) =>
			(await fetch(
				API_BASE_URL +
					`/agents/messages?agent_id=${agentId}&limit=3&user_id=${userId}${pageParam ? '&before=' + pageParam : ''}`
			).then((res) => res.json())) as Promise<{
				messages: Message[];
			}>,
		getPreviousPageParam: (firstPage) => {
			return firstPage.messages[firstPage.messages?.length ? firstPage.messages.length - 1 : 0]?.id ?? undefined;
		},
		getNextPageParam: (lastPage) => lastPage.messages[0]?.id ?? undefined,
		enabled: !!userId && !!agentId,
	});
