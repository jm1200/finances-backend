export const defaultCategories = (userId: number) => {
  return [
    {
      userId,
      name: "Income",
      subCategories: ["Person A", "Business B", "Rental C"],
    },
    {
      userId,
      name: "Rental Property A",
      subCategories: [
        "Electricity",
        "Gas",
        "Cable",
        "Property Taxes",
        "Mortgage",
      ],
    },
    {
      userId,
      name: "Home",
      subCategories: [
        "Mortgage",
        "Property Taxes",
        "Cable",
        "Gas",
        "Electricity",
        "Water",
      ],
    },
    {
      userId,
      name: "Food",
      subCategories: ["Fast food", "Restaurants", "Groceries"],
    },
    {
      userId,
      name: "Kids",
      subCategories: ["Clothes", "School", "Entertainement", "Activities"],
    },
  ];
};
