'use client';

import { ProductCard } from '@/components/product-card';
import type { Product } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackageSearch } from 'lucide-react';
import { useLocale } from '@/context/locale-context';
import { Loader } from '@/components/ui/loader';
import { getProducts } from '@/services/productService';

export default function ProductsPage() {
  const { translations } = useLocale();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const productsData = await getProducts();
        const uniqueProductsByName = Array.from(new Map(productsData.map(p => [p.name, p])).values());
        setAllProducts(uniqueProductsByName);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    if (isLoading) return ['all'];
    const uniqueCategories = ['all', ...new Set(allProducts.map(p => p.category))];
    return uniqueCategories;
  }, [allProducts, isLoading]);

  const filteredAndSortedProducts = useMemo(() => {
    if (isLoading) return [];
    let filtered = [...allProducts];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }
    return filtered;
  }, [searchTerm, selectedCategory, sortBy, allProducts, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader text={translations.common.loading} size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="font-headline text-4xl font-bold text-primary">{translations.productPage.title}</h1>
        <p className="text-lg text-muted-foreground">{translations.productPage.tagline}</p>
      </header>

      <div className="sticky top-16 bg-background/90 backdrop-blur-sm z-10 py-4 rounded-md shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-lg bg-card">
          <Input
            type="text"
            placeholder={translations.productPage.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-1"
            aria-label={translations.productPage.searchPlaceholder}
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:col-span-1" aria-label={translations.productPage.filterByCategory}>
              <SelectValue placeholder={translations.productPage.filterByCategory} />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? translations.productPage.allCategories : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:col-span-1" aria-label={translations.productPage.sortBy}>
              <SelectValue placeholder={translations.productPage.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">{translations.productPage.sortNameAsc}</SelectItem>
              <SelectItem value="name-desc">{translations.productPage.sortNameDesc}</SelectItem>
              <SelectItem value="price-asc">{translations.productPage.sortPriceAsc}</SelectItem>
              <SelectItem value="price-desc">{translations.productPage.sortPriceDesc}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredAndSortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <PackageSearch className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
          <h2 className="font-headline text-2xl font-semibold text-foreground mb-2">{translations.productPage.noProductsFound}</h2>
          <p className="text-muted-foreground">
            {translations.productPage.noProductsHint}
          </p>
        </div>
      )}
    </div>
  );
}
