import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | HotelVendors - Hospitality Industry Insights',
  description: 'Stay updated with the latest trends, tips, and insights in the hospitality industry. Expert advice for hotel owners and vendors.',
  keywords: 'hospitality blog, hotel industry, vendor management, hotel operations, hospitality trends',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
