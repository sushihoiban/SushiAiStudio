
import React from 'react';
import { useSettings } from '../hooks/use-settings';

const Menu: React.FC = () => {
  const { t, formatCurrency } = useSettings();

  const categories = [
    {
      title: t('menu.nigiri'),
      items: [
        { name: t('menu.sake'), price: 8, desc: t('menu.sake_desc') },
        { name: t('menu.maguro'), price: 9, desc: t('menu.maguro_desc') },
        { name: t('menu.hamachi'), price: 10, desc: t('menu.hamachi_desc') },
      ]
    },
    {
      title: t('menu.special_rolls'),
      items: [
        { name: t('menu.dragon_roll'), price: 18, desc: t('menu.dragon_desc') },
        { name: t('menu.rainbow_roll'), price: 20, desc: t('menu.rainbow_desc') },
        { name: t('menu.volcano_roll'), price: 22, desc: t('menu.volcano_desc') },
      ]
    }
  ];

  return (
    // Container constrained to 90% mobile, dynamic desktop width
    <div className="w-[90%] md:w-[var(--content-width)] mx-auto py-16">
      <h1 className="mb-12 text-center font-serif text-4xl text-gold-500">{t('navigation.menu')}</h1>
      
      <div className="grid gap-12 md:grid-cols-2 max-w-4xl mx-auto">
        {categories.map((cat) => (
          <div key={cat.title} className="space-y-6">
            <h2 className="border-b border-gold-500/30 pb-2 font-serif text-2xl text-neutral-100">{cat.title}</h2>
            <div className="space-y-6">
              {cat.items.map((item) => (
                <div key={item.name} className="flex justify-between items-baseline">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-200">{item.name}</h3>
                    <p className="text-sm text-neutral-500">{item.desc}</p>
                  </div>
                  <span className="text-gold-500 font-semibold">{formatCurrency(item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
