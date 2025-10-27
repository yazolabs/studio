export type PaginationMeta = {
  currentPage: number;
  from: number | null;
  lastPage: number;
  perPage: number;
  to: number | null;
  total: number;
};

export type PaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
};
