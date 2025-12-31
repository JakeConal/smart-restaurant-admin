"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button, Input, Modal, Select } from "@/shared/components/ui";
import {
  ArrowLeft,
  ShoppingCart,
  User,
  ChefHat,
  Menu,
  Search,
  Star,
  Plus,
  Minus,
  List,
  ClipboardList,
  UtensilsCrossed,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: "available" | "unavailable" | "sold_out";
  isChefRecommended?: boolean;
  categoryId?: string;
  categoryName?: string;
  primaryPhoto?: string;
  modifierGroups?: ModifierGroup[];
  canOrder?: boolean;
  rating?: number;
  reviewCount?: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  type: "single" | "multiple";
  minSelections?: number;
  maxSelections?: number;
  required: boolean;
  options: ModifierOption[];
}

interface ModifierOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  isDefault?: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
}

interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
  pagination: any;
}

function RestaurantMenuPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const restaurantId = params.restaurantId as string;
  const tableId = searchParams.get("table");
  const token = searchParams.get("token");
  const mode = searchParams.get("mode"); // "guest" or undefined for logged in

  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("menu");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, string[]>
  >({});
  const [itemTotal, setItemTotal] = useState(0);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!tableId || !token) {
        setError("Missing table or token information");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/menu?table=${tableId}&token=${token}`,
        );
        const data = await response.json();

        if (data.success) {
          setTableInfo(data.table);
          setMenuData(data.menu);
          setAllMenuItems(data.menu.items || []);
          setFilteredItems(data.menu.items || []);
        } else {
          setError(data.message || "Failed to load menu");
        }
      } catch (err) {
        console.error("Error fetching menu:", err);
        setError("Failed to load menu. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [tableId, token]);

  useEffect(() => {
    let filtered = allMenuItems;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (item) => item.categoryId === selectedCategory,
      );
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedCategory, allMenuItems]);

  const handleBack = () => {
    window.history.back();
  };

  const handleAddToCart = (item: MenuItem) => {
    // TODO: Add to cart logic
    setCartCount((prev) => prev + 1);
    console.log("Added to cart:", item);
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSelectedModifiers({});
    setItemTotal(item.price);
    setIsItemModalOpen(true);
  };

  const handleModifierChange = (
    groupId: string,
    optionId: string,
    isSelected: boolean,
  ) => {
    if (!selectedItem) return;

    const group = selectedItem.modifierGroups?.find((g) => g.id === groupId);
    if (!group) return;

    setSelectedModifiers((prev) => {
      const currentSelections = prev[groupId] || [];
      let newSelections: string[];

      if (group.type === "single") {
        // Single selection: replace current selection
        newSelections = isSelected ? [optionId] : [];
      } else {
        // Multiple selection: add/remove from current selections
        if (isSelected) {
          newSelections = [...currentSelections, optionId];
        } else {
          newSelections = currentSelections.filter((id) => id !== optionId);
        }

        // Enforce max selections if specified
        if (group.maxSelections && newSelections.length > group.maxSelections) {
          newSelections = newSelections.slice(-group.maxSelections);
        }
      }

      return { ...prev, [groupId]: newSelections };
    });
  };

  const calculateTotal = () => {
    if (!selectedItem) return 0;

    let total = selectedItem.price * quantity;

    // Add modifier prices
    Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
      const group = selectedItem.modifierGroups?.find((g) => g.id === groupId);
      if (group) {
        optionIds.forEach((optionId) => {
          const option = group.options.find((o) => o.id === optionId);
          if (option) {
            total += option.price * quantity;
          }
        });
      }
    });

    return total;
  };

  const handleAddItemToCart = () => {
    if (!selectedItem) return;

    // Validate required modifiers
    const missingRequired = selectedItem.modifierGroups?.filter((group) => {
      if (!group.required) return false;
      const selected = selectedModifiers[group.id] || [];
      return selected.length < (group.minSelections || 1);
    });

    if (missingRequired && missingRequired.length > 0) {
      alert(
        `Please select options for: ${missingRequired.map((g) => g.name).join(", ")}`,
      );
      return;
    }

    // TODO: Add to cart with modifiers and quantity
    const cartItem = {
      item: selectedItem,
      quantity,
      selectedModifiers,
      total: calculateTotal(),
    };

    console.log("Adding to cart:", cartItem);
    setCartCount((prev) => prev + quantity);
    setIsItemModalOpen(false);
  };

  useEffect(() => {
    setItemTotal(calculateTotal());
  }, [quantity, selectedModifiers, selectedItem]);

  const categories = [
    { id: "all", name: "All" },
    ...(menuData?.categories || []),
  ];

  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <ChefHat className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Unable to load menu</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App Header */}
      <header className="bg-orange-500 text-white shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-orange-600 p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Smart Restaurant</h1>
          </div>
          <div className="bg-orange-600 px-3 py-1 rounded-full text-sm font-medium">
            Table {tableInfo?.tableNumber || tableId}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full border-gray-300 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white px-4 py-3 border-b overflow-x-auto">
        <div className="flex space-x-2 pb-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <main className="flex-1 px-4 py-4 pb-20">
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-start space-x-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.primaryPhoto ? (
                    <img
                      src={item.primaryPhoto}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          {renderStars(item.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          ({item.reviewCount || 0})
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-orange-600 mb-2">
                        ${item.price.toFixed(2)}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        disabled={!item.canOrder || item.status !== "available"}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 h-auto text-sm font-medium"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Quick Add
                      </Button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.status === "available"
                            ? "bg-green-100 text-green-800"
                            : item.status === "sold_out"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.status === "available"
                          ? "Available"
                          : item.status === "sold_out"
                            ? "Sold Out"
                            : "Unavailable"}
                      </span>
                      {item.isChefRecommended && (
                        <div className="flex items-center space-x-1 text-orange-600">
                          <ChefHat className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            Chef's Choice
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? "No items match your search"
                : "No menu items available"}
            </p>
          </div>
        )}
      </main>

      {/* Item Details Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        maxWidth="lg"
        padding="p-0"
      >
        {selectedItem && (
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Item Image/Header */}
            <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              {selectedItem.primaryPhoto ? (
                <img
                  src={selectedItem.primaryPhoto}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="w-16 h-16 text-orange-600" />
              )}
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Item Details */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedItem.name}
                  </h2>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(selectedItem.rating)}
                    </div>
                    <span className="text-sm text-gray-500">
                      ({selectedItem.reviewCount || 0} reviews)
                    </span>
                  </div>
                  {selectedItem.description && (
                    <p className="text-gray-600 mb-4">
                      {selectedItem.description}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-orange-600">
                    ${selectedItem.price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Modifiers */}
              {selectedItem.modifierGroups &&
                selectedItem.modifierGroups.length > 0 && (
                  <div className="space-y-6 mb-6">
                    {selectedItem.modifierGroups.map((group) => (
                      <div key={group.id} className="border-t pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {group.name}
                            {group.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </h3>
                          {group.type === "multiple" && group.maxSelections && (
                            <span className="text-sm text-gray-500">
                              Select up to {group.maxSelections}
                            </span>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {group.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          {group.options.map((option) => {
                            const isSelected = (
                              selectedModifiers[group.id] || []
                            ).includes(option.id);
                            return (
                              <label
                                key={option.id}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                  isSelected
                                    ? "border-orange-500 bg-orange-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  {group.type === "multiple" ? (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) =>
                                        handleModifierChange(
                                          group.id,
                                          option.id,
                                          e.target.checked,
                                        )
                                      }
                                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                    />
                                  ) : (
                                    <input
                                      type="radio"
                                      name={`modifier-${group.id}`}
                                      checked={isSelected}
                                      onChange={() =>
                                        handleModifierChange(
                                          group.id,
                                          option.id,
                                          true,
                                        )
                                      }
                                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                    />
                                  )}
                                  <div>
                                    <span className="font-medium text-gray-900">
                                      {option.name}
                                    </span>
                                    {option.description && (
                                      <p className="text-sm text-gray-600">
                                        {option.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {option.price > 0 && (
                                  <span className="text-sm font-medium text-gray-900">
                                    +${option.price.toFixed(2)}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Quantity and Total */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">
                    Quantity
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    ${itemTotal.toFixed(2)}
                  </span>
                </div>

                <Button
                  onClick={handleAddItemToCart}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg font-semibold"
                >
                  Add to Cart - ${itemTotal.toFixed(2)}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === "menu" ? "text-orange-500" : "text-gray-500"
            }`}
          >
            <List className="w-5 h-5" />
            <span className="text-xs font-medium">Menu</span>
          </button>

          <button
            onClick={() => setActiveTab("cart")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors relative ${
              activeTab === "cart" ? "text-orange-500" : "text-gray-500"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
            <span className="text-xs font-medium">Cart</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === "orders" ? "text-orange-500" : "text-gray-500"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs font-medium">Orders</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
              activeTab === "profile" ? "text-orange-500" : "text-gray-500"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function RestaurantMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <RestaurantMenuPageContent />
    </Suspense>
  );
}
