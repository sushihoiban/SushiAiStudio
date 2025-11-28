
import React from 'react';

const Menu: React.FC = () => {
  const categories = [
    {
      title: "Nigiri",
      items: [
        { name: "Sake (Salmon)", price: "$8", desc: "Fresh Norwegian salmon" },
        { name: "Maguro (Tuna)", price: "$9", desc: "Yellowfin tuna" },
        { name: "Hamachi (Yellowtail)", price: "$10", desc: "Japanese yellowtail" },
      ]
    },
    {
      title: "Special Rolls",
      items: [
        { name: "Dragon Roll", price: "$18", desc: "Eel, cucumber, avocado" },
        { name: "Rainbow Roll", price: "$20", desc: "Crab, avocado, topped with assorted fish" },
        { name: "Volcano Roll", price: "$22", desc: "Spicy tuna, tempura flakes, spicy mayo" },
      ]
    }
  ];

  return (
    // Container constrained to 90% mobile, dynamic desktop width
    <div className="w-[90%] md:w-[var(--content-width)] mx-auto py-16">
      <h1 className="mb-12 text-center font-serif text-4xl text-gold-500">Our Menu</h1>
      
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
                  <span className="text-gold-500 font-semibold">{item.price}</span>
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
