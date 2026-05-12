import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#121212] text-white px-6 py-24 md:px-16 lg:px-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
        {/* Column 1 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <span className="text-4xl font-display font-medium tracking-tight text-white">HotelVendors</span>
          <p className="text-muted-teal font-body leading-relaxed max-w-xs text-sm">
            The world's most ambitious hotels, for hospitality procurement and vendor management.
          </p>
        </div>

        {/* Column 2 - Links */}
        <div className="flex flex-col gap-8">
          <h4 className="text-white font-display text-xs font-bold uppercase tracking-widest">Navigation</h4>
          <div className="flex flex-col gap-4 font-body text-muted-teal text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/vendors" className="hover:text-white transition-colors">Vendors</Link>
            <Link href="/deals" className="hover:text-white transition-colors">Deals</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          </div>
        </div>

        {/* Column 3 - Account */}
        <div className="flex flex-col gap-8">
          <h4 className="text-white font-display text-xs font-bold uppercase tracking-widest">Account</h4>
          <div className="flex flex-col gap-4 font-body text-muted-teal text-sm">
            <Link href="/auth" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/auth?register=true" className="hover:text-white transition-colors">Join as Vendor</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-center items-center gap-4 text-muted-teal font-body text-xs">
        <p>© 2024 HotelVendors. All rights reserved.</p>
      </div>
    </footer>
  );
}

