export type PublicVideoItem = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  publishedAt?: string;
  uploadDate: string;
  youTubeVideoId: string;
};

export type PublicVideoListResponse = {
  items: PublicVideoItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type PublicVideoDetailResponse = {
  video: {
    id: number;
    slug: string;
    title: string;
    description?: string;
    thumbnailUrl: string;
    youTubeVideoId: string;
    youTubeUrl: string;
    publishedAt?: string;
    uploadDate: string;
    embedUrl: string;
  };
  related: Array<{
    id: number;
    slug: string;
    title: string;
    thumbnailUrl: string;
    youTubeVideoId: string;
  }>;
};

export type AdminVideoItem = {
  id: number;
  title: string;
  description?: string;
  slug: string;
  youTubeVideoId: string;
  youTubeUrl: string;
  thumbnailUrl: string;
  publishedAt?: string;
  uploadDate: string;
  isPublic: boolean;
  viewCount: number;
};
