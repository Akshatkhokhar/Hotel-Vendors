'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MagnifyingGlass, 
  ChartBar, 
  ChatCenteredText, 
  Users,
  ShieldCheck,
  Storefront,
  Globe,
  ArrowRight
} from "@phosphor-icons/react";
import { useState, useEffect } from 'react';
import { getVendors } from '@/lib/api';
import { useUser } from '@/lib/context/UserContext';

export default function HomePage() {
  const [featuredVendors, setFeaturedVendors] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useUser();
  const [activeCategory, setActiveCategory] = useState('Housekeeping');

  const categoriesData: { [key: string]: any } = {
    'Housekeeping': {
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800',
      title1: 'Housekeeping Solutions',
      desc1: 'Comprehensive cleaning and maintenance services tailored for the hospitality sector. Our expert teams ensure every corner of your property reflects perfection.',
      title2: 'Eco-Friendly Cleaning',
      desc2: 'Utilizing sustainable products and advanced methods to ensure a pristine environment for your guests without compromising on safety or environmental standards.'
    },
    'Furniture': {
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
      title1: 'Furnishing Solutions',
      desc1: 'Setting the gold standard in bespoke hospitality interiors for over three decades. Our commitment to sustainability and timeless aesthetics ensures your hotel stands out.',
      title2: 'Sustainable Supply Chain',
      desc2: 'Reducing your carbon footprint through ethically sourced materials and energy-efficient logistics to deliver products that honor the environment.'
    },
    'Technology': {
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      title1: 'Smart Hotel Systems',
      desc1: 'Next-generation guest experience platforms and automated facility management. We bridge the gap between quality service and high-tech efficiency.',
      title2: 'Future-Proof Tech',
      desc2: 'Scalable IT infrastructure and cybersecurity solutions designed specifically for the hospitality industry, ensuring seamless operations and guest data protection.'
    },
    'Amenities': {
      image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=800',
      title1: 'Guest Amenities',
      desc1: 'Curated collections of toiletries, spa products, and personalized in-room experiences that define the character of your hospitality brand.',
      title2: 'Artisanal Partners',
      desc2: 'Sourcing unique, local products and sustainable essentials that tell a story and delight your guests while supporting local craftsmanship.'
    },
    'Textiles': {
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
      title1: ' & Textiles',
      desc1: 'High-thread-count bedding, plush towels, and elegant upholstery fabrics engineered for durability and the ultimate guest comfort.',
      title2: 'Durability & Comfort',
      desc2: 'Specially designed commercial textiles that maintain their soft, residential feel even after hundreds of industrial washes, ensuring long-term value.'
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await getVendors({ limit: 4 });
        if (res.success) {
          setFeaturedVendors(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchFeatured();
    
    // Trigger animations after component mounts
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2000" 
          alt="Hotel Lobby" 
          fill 
          className="object-cover scale-105 transition-transform duration-[20s] hover:scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/50" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-bounce-subtle"></div>
        <div className="absolute bottom-32 right-16 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-bounce-subtle" style={{ animationDelay: '1s' }}></div>
        
        <div className={`relative z-10 text-center px-6 max-w-5xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-12">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display text-white mb-8 font-medium leading-tight">
              <span className="inline-block px-8 py-2 bg-black/10 backdrop-blur-sm rounded-2xl animate-slide-in-from-bottom duration-700 mb-4">Hotel</span>
              <br />
              <span className="inline-block px-8 py-2 bg-black/10 backdrop-blur-sm rounded-2xl text-amber animate-slide-in-from-bottom duration-700" style={{ animationDelay: '200ms' }}>Vendors</span>
            </h1>
            
            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-xl md:text-2xl text-white/90 font-body max-w-2xl mx-auto leading-relaxed inline-block px-6 py-3 bg-black/10 backdrop-blur-sm rounded-xl">
                Connecting hotels with world-class suppliers through our marketplace
              </p>
            </div>
          </div>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link 
              href="/vendors" 
              className="group px-8 py-4 bg-gradient-to-r from-primary to-muted-teal text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/25 btn-modern"
            >
              <span className="flex items-center gap-3">
                Explore Vendors
                <ArrowRight size={20} weight="light" className="group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
            
            <div className="flex items-center">
              {!user && (
                <Link 
                  href="/auth?register=true" 
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  List Your Business
                </Link>
              )}
            </div>
          </div>
        </div>


      </section>

      {/* Categories / Find Suppliers */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-outline/20 pb-12">
          <h2 className="text-4xl md:text-5xl font-display text-foreground">
            Find the best <span className="text-amber italic">suppliers for you</span>
          </h2>
          <Link 
            href="/vendors" 
            className="group text-xs font-bold tracking-[0.2em] text-amber uppercase flex items-center gap-4 hover:text-primary transition-colors duration-300"
          >
            BROWSE ALL
            <span className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg group-hover:scale-110 group-hover:rotate-45 transition-all duration-300">
              →
            </span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 mb-24">
          {['Housekeeping', 'Furniture', 'Technology', 'Amenities', 'Textiles'].map((cat, i) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full font-body text-sm font-medium transition-all duration-300 hover:scale-105 ${
                activeCategory === cat 
                  ? 'bg-gradient-to-r from-amber to-rose text-white shadow-lg hover:shadow-xl' 
                  : 'bg-white dark:bg-surface text-foreground/70 border border-outline/20 hover:border-primary hover:text-primary hover:shadow-lg'
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-elegant-lg group">
             <Image 
               src={categoriesData[activeCategory].image} 
               alt={activeCategory} 
               fill 
               className="object-cover group-hover:scale-110 transition-transform duration-700" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div className="flex flex-col gap-12 lg:pl-12">
             <div className="border-b border-outline/20 pb-12 group">
                <h3 className="text-xl font-display text-amber font-bold tracking-[0.15em] uppercase mb-6 group-hover:text-primary transition-colors duration-300">
                  {categoriesData[activeCategory].title1}
                </h3>
                <p className="text-foreground/70 font-body leading-relaxed text-lg">
                  {categoriesData[activeCategory].desc1}
                </p>
             </div>
             <div className="group">
                <h3 className="text-xl font-display text-amber font-bold tracking-[0.15em] uppercase mb-6 group-hover:text-primary transition-colors duration-300">
                  {categoriesData[activeCategory].title2}
                </h3>
                <p className="text-foreground/70 font-body leading-relaxed text-lg">
                  {categoriesData[activeCategory].desc2}
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* How It Works Section (SEO Optimized) */}
      <section className="py-24 px-6 md:px-16 w-full bg-gradient-to-br from-surface to-surface-dim border-y border-outline/10">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
             <h2 className="text-4xl md:text-5xl font-display text-amber italic mb-6">
               Streamlining your procurement journey
             </h2>
             <p className="text-foreground/60 font-body max-w-2xl mx-auto text-lg">
               Our marketplace connects hotels with world-class suppliers, ensuring a seamless sourcing experience from discovery to delivery.
             </p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {[
               {
                 step: "01",
                 title: "Discover Vendors",
                 desc: "Browse our curated list of vetted hospitality suppliers across categories like Textiles, Technology, and Furniture.",
                 icon: <MagnifyingGlass size={32} weight="light" />
               },
               {
                 step: "02",
                 title: "Compare Profiles",
                 desc: "Analyze detailed vendor profiles, product catalogs, and certifications to find the perfect match for your hotel's standards.",
                 icon: <ChartBar size={32} weight="light" />
               },
               {
                 step: "03",
                 title: "Direct Contact",
                 desc: "Skip the middleman. Connect directly with business owners and sales teams to negotiate the best deals for your property.",
                 icon: <ChatCenteredText size={32} weight="light" />
               },
               {
                 step: "04",
                 title: "Build Partnerships",
                 desc: "Foster long-term relationships with reliable suppliers who understand the unique needs of the hospitality market.",
                 icon: <Users size={32} weight="light" />
               }
             ].map((feature, i) => (
               <div 
                 key={i} 
                 className="bg-white dark:bg-surface p-8 rounded-[32px] shadow-elegant hover:shadow-elegant-lg transition-all duration-500 hover:-translate-y-2 border border-outline/5 relative group"
                 style={{ animationDelay: `${i * 150}ms` }}
               >
                 <div className="absolute top-6 right-8 text-5xl font-display font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                   {feature.step}
                 </div>
                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-muted-teal/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-500">
                   {feature.icon}
                 </div>
                 <h3 className="text-xl font-bold text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
                   {feature.title}
                 </h3>
                 <p className="text-foreground/60 font-body text-sm leading-relaxed">
                   {feature.desc}
                 </p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="bg-gradient-to-br from-primary to-muted-teal text-white py-32 px-6 md:px-16 w-full relative overflow-hidden">
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-10">
           <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full"></div>
           <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/10 rounded-full"></div>
           <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
         </div>
         
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <h2 className="text-4xl md:text-5xl lg:text-6xl font-display leading-[1.2]">
                  Simplifying sourcing for <br/><span className="text-amber">modern</span> hospitality<br/>businesses.
               </h2>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="text-center group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                     <div className="mb-4 flex justify-center">
                        <ShieldCheck size={40} weight="light" className="text-amber" />
                     </div>
                     <span className="text-xl font-display font-medium block">Verified</span>
                     <span className="text-[10px] font-bold tracking-widest uppercase text-white/60 mt-2 block">Vetted Suppliers</span>
                  </div>
                  <div className="text-center group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                     <div className="mb-4 flex justify-center">
                        <ChatCenteredText size={40} weight="light" className="text-amber" />
                     </div>
                     <span className="text-xl font-display font-medium block">Direct</span>
                     <span className="text-[10px] font-bold tracking-widest uppercase text-white/60 mt-2 block">Easy Contact</span>
                  </div>
                  <div className="text-center group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                     <div className="mb-4 flex justify-center">
                        <Storefront size={40} weight="light" className="text-amber" />
                     </div>
                     <span className="text-xl font-display font-medium block">Efficient</span>
                     <span className="text-[10px] font-bold tracking-widest uppercase text-white/60 mt-2 block">Save Time</span>
                  </div>
               </div>
            </div>
         </div>
      </section>



      <Footer />
    </div>
  );
}

