-- Enable Row Level Security on all public tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kqoyuwvzzoffpjrhzvkg/sql

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for public read access (adjust as needed)
-- Products, categories, etc. should be publicly readable

CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.cms_pages FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.snippets FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.vendors FOR SELECT USING (true);

-- User-specific tables: users can only access their own data
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()::text)
);

CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage own wishlist" ON public.wishlist_items FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can manage own addresses" ON public.saved_addresses FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can view own search history" ON public.search_history FOR SELECT USING (auth.uid()::text = user_id);

-- Newsletter: anyone can subscribe
CREATE POLICY "Allow public insert" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true);

-- Search logs: insert only
CREATE POLICY "Allow insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);
