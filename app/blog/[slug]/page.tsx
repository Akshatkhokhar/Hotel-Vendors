import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// This would typically come from a CMS or database
const blogPosts = {
  'future-hotel-vendor-management-2024': {
    title: 'The Future of Hotel Vendor Management in 2024',
    content: `
      <p>The hospitality industry is undergoing a digital transformation that's reshaping how hotels manage their vendor relationships. As we move through 2024, technology is becoming the cornerstone of efficient vendor management, offering unprecedented opportunities for streamlining operations and enhancing guest experiences.</p>
      
      <h2>Digital Transformation in Vendor Management</h2>
      <p>Modern hotel operations rely on a complex network of vendors, from housekeeping supplies to high-tech amenities. Traditional vendor management methods are giving way to sophisticated digital platforms that offer real-time tracking, automated ordering, and predictive analytics.</p>
      
      <h2>Key Trends Shaping the Industry</h2>
      <h3>1. AI-Powered Procurement</h3>
      <p>Artificial intelligence is revolutionizing how hotels predict demand, optimize inventory, and select vendors. Machine learning algorithms analyze historical data to forecast needs and suggest optimal ordering schedules.</p>
      
      <h3>2. Sustainable Vendor Partnerships</h3>
      <p>Environmental consciousness is driving hotels to prioritize vendors with strong sustainability credentials. This shift is not just about compliance but about meeting guest expectations and reducing operational costs.</p>
      
      <h3>3. Integrated Technology Platforms</h3>
      <p>The future belongs to integrated platforms that connect all aspects of hotel operations. These systems provide a single dashboard for managing vendor relationships, tracking performance, and analyzing costs.</p>
      
      <h2>Benefits of Modern Vendor Management</h2>
      <ul>
        <li><strong>Cost Optimization:</strong> Better negotiation power through data-driven insights</li>
        <li><strong>Quality Assurance:</strong> Continuous monitoring of vendor performance</li>
        <li><strong>Risk Mitigation:</strong> Diversified supplier networks and backup options</li>
        <li><strong>Operational Efficiency:</strong> Automated processes reduce manual workload</li>
      </ul>
      
      <h2>Looking Ahead</h2>
      <p>As we progress through 2024, hotels that embrace these technological advances will gain significant competitive advantages. The key is to choose platforms and partners that align with your property's specific needs and growth objectives.</p>
      
      <p>The future of hotel vendor management is bright, with technology enabling more strategic, efficient, and sustainable partnerships than ever before.</p>
    `,
    author: 'Sarah Johnson',
    date: '2024-03-15',
    readTime: '5 min read',
    category: 'Industry Trends',
    excerpt: 'Discover how technology is revolutionizing the way hotels manage their vendor relationships and streamline operations.'
  }
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug as keyof typeof blogPosts];
  
  if (!post) {
    return {
      title: 'Post Not Found | HotelVendors Blog'
    };
  }

  return {
    title: `${post.title} | HotelVendors Blog`,
    description: post.excerpt,
    keywords: 'hospitality, hotel management, vendor management, industry trends',
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts[slug as keyof typeof blogPosts];

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative py-20 bg-gradient-to-br from-primary to-muted-teal text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-300 mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
          
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-amber text-white text-sm font-semibold rounded-full mb-4">
              {post.category}
            </span>
          </div>
          
          <h1 className="font-display text-4xl lg:text-5xl font-bold mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-6 text-white/80">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent"></div>
      </header>

      {/* Article Content */}
      <article className="py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-foreground/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.75'
              }}
            />
          </div>
          
          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-outline/20">
            <h3 className="font-display text-xl font-semibold text-foreground mb-4">
              Share this article
            </h3>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
                Twitter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-muted-teal/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            Related Articles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Related article cards would go here */}
            <div className="bg-white dark:bg-surface rounded-2xl p-6 shadow-elegant hover:shadow-elegant-lg transition-all duration-300 hover:scale-105">
              <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-muted-teal/10 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-foreground/60">Related Article</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Top 10 Essential Vendors Every Hotel Needs
              </h3>
              <p className="text-foreground/70 text-sm">
                From linens to cutting-edge technology, explore the must-have vendor partnerships...
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}