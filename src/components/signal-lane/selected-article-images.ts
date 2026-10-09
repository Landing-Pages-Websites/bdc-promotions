const articleOriginals = [
  {
    "slug": "automotive-dealership-crm-buyer-guide",
    "sourceUrl": "https://zleague-public-prod.s3.us-east-2.amazonaws.com/article_images/9951b3b9-96d6-4185-a938-f509cd50ae67/automotive-dealership-crm-buyer-guide-333230.webp",
    "localPath": "/images/design/blog__automotive-dealership-crm-buyer-guide/02-article-original.webp"
  },
  {
    "slug": "car-dealership-marketing-agency",
    "sourceUrl": "https://zleague-public-prod.s3.us-east-2.amazonaws.com/article_images/9951b3b9-96d6-4185-a938-f509cd50ae67/car-dealership-marketing-agency-how-to-choose-919633.webp",
    "localPath": "/images/design/blog__car-dealership-marketing-agency/02-article-original.webp"
  }
] as const;

export function selectedArticleImageSrc(slug: string, image: string): string {
  return articleOriginals.find((original) => original.slug === slug && original.sourceUrl === image)?.localPath ?? image;
}
