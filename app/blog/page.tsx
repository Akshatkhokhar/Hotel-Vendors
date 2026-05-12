'use client';

import Link from 'next/link';
import { Article, CaretLeft } from "@phosphor-icons/react";

const blogPosts = [
  {
    id: 1,
    title: 'How Generative AI is Redefining Guest Personalization in 2026',
    excerpt: 'Beyond basic recommendations, modern AI now anticipates guest preferences—from room temperature to pillow types—before they even check in. Learn how to leverage this data.',
    author: 'Dr. Julian Vance',
    date: '2026-05-12',
    readTime: '6 min read',
    category: 'Technology',
    image: '/blog/ai-personalization.jpg',
    url: 'https://www.mews.com/en/blog/2026-hospitality-outlook-ai-hotels'
  },
  {
    id: 2,
    title: 'The Rise of Biometric Security in Premium Hospitality',
    excerpt: 'Keycards are becoming a thing of the past. Facial recognition and palm-vein scanning are now the gold standard for secure, frictionless access in elite resorts.',
    author: 'Marcus Thorne',
    date: '2026-05-08',
    readTime: '5 min read',
    category: 'Security',
    image: '/blog/biometric-security.jpg',
    url: 'https://www.hoteltechreport.com/news/biometric-security-hospitality'
  },
  {
    id: 3,
    title: 'ESG Transparency: Why Your Vendor Chain is Your Reputation',
    excerpt: 'In 2026, guests are auditing your suppliers as much as your services. Here is how to verify the sustainability credentials of your entire supply chain.',
    author: 'Elena Rossi',
    date: '2026-05-01',
    readTime: '7 min read',
    category: 'Sustainability',
    image: '/blog/esg-transparency.jpg',
    url: 'https://www.hospitalitynet.org/opinion/4119864.html'
  },
  {
    id: 4,
    title: 'Autonomous Housekeeping: Integrating Robotics into Your Staff',
    excerpt: 'Robotics are no longer a gimmick. From vacuuming corridors to delivering linens, explore the most efficient ways to augment your team with autonomous tech.',
    author: 'Kevin Chen',
    date: '2026-04-22',
    readTime: '8 min read',
    category: 'Operations',
    image: '/blog/robotics-operations.jpg',
    url: 'https://www.ehl.edu/en/research/hospitality-insights/robotics-in-hospitality'
  }
];

const categories = ['All', 'Technology', 'Security', 'Sustainability', 'Operations', 'Industry Trends'];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary to-muted-teal text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm font-semibold mb-8 hover:bg-white/20 transition-all group"
          >
            <CaretLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="font-display text-5xl lg:text-6xl font-bold mb-6">
              Hospitality Insights
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
              Expert insights, industry trends, and practical advice for hotel owners and vendors
            </p>
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className="px-6 py-3 rounded-full border border-primary/20 text-foreground/70 hover:bg-primary hover:text-white transition-all duration-300 hover:scale-105"
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Post */}
          <div className="mb-16">
            <Link 
              href={blogPosts[0].url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative rounded-2xl overflow-hidden bg-white dark:bg-surface shadow-elegant-lg group cursor-pointer border border-outline/10"
            >
              <div className="aspect-[16/9] lg:aspect-[21/9] bg-gradient-to-br from-primary/20 to-muted-teal/20 flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-700">
                <div className="text-center p-8">
                  <span className="inline-block px-4 py-2 bg-amber text-white text-sm font-semibold rounded-full mb-4">
                    Featured
                  </span>
                  <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {blogPosts[0].title}
                  </h2>
                  <p className="text-foreground/70 text-lg max-w-2xl mx-auto mb-6">
                    {blogPosts[0].excerpt}
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm text-foreground/60">
                    <span>{blogPosts[0].author}</span>
                    <span>•</span>
                    <span>{blogPosts[0].date}</span>
                    <span>•</span>
                    <span>{blogPosts[0].readTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post, index) => (
              <Link
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group cursor-pointer block"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-white dark:bg-surface rounded-2xl overflow-hidden shadow-elegant hover:shadow-elegant-lg transition-all duration-500 hover:scale-[1.02] border border-outline/10">
                  
                  {/* Image Placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-muted-teal/10 flex items-center justify-center group-hover:from-primary/20 transition-all duration-500">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Article size={32} weight="light" className="text-primary" />
                      </div>
                      <span className="text-sm text-foreground/60">Read Full Article</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-foreground/60">{post.readTime}</span>
                    </div>
                    
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {post.title}
                    </h3>
                    
                    <p className="text-foreground/70 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-foreground/60 border-t border-outline/5 pt-4">
                      <span>{post.author}</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="px-8 py-4 bg-gradient-to-r from-primary to-muted-teal text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-lg">
              Load More Articles
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-muted-teal/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Stay Updated
          </h2>
          <p className="text-foreground/70 text-lg mb-8">
            Get the latest hospitality insights delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-xl border border-outline/20 bg-white dark:bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="px-8 py-4 bg-gradient-to-r from-primary to-muted-teal text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
