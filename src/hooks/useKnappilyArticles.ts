import { useInfiniteQuery } from "@tanstack/react-query";
import { knappilyService } from "@/services/knappilyService";

const ARTICLES_PER_PAGE = 10;

// This function tells TanStack Query how to fetch a page of articles.
const fetchArticles = async ({ pageParam = 0 }) => {
  const offset = pageParam;
  const { cards, hasMore } = await knappilyService.getArticles(ARTICLES_PER_PAGE, offset);
  return {
    articles: cards,
    nextOffset: hasMore ? offset + cards.length : undefined,
  };
};

export const useKnappilyArticles = () => {
  return useInfiniteQuery({
    queryKey: ['knappilyArticles'], // A unique key for this query
    queryFn: fetchArticles,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset, // Use the returned offset for the next fetch
  });
};