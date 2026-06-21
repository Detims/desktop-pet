import { useMemo, useState, useEffect } from 'react'
import { PET_SHOP_ITEMS } from './PetShopItems'

export function PetShop() {
    const [coins, setCoins] = useState(0)
    const [shopMessage, setShopMessage] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('All')
    const [ownedItemIds, setOwnedItemIds] = useState<string[]>([])
    const [searchText, setSearchText] = useState('')

    useEffect(() => {
        window.desktopPet.getPetSave().then((save) => {
            setCoins(save.currency)
        })

        return window.desktopPet.onPetSaveUpdated((save) => {
            setCoins(save.currency)
        })
    }, [])

    const categories = useMemo(() => {
        return ['All', ...Array.from(new Set(PET_SHOP_ITEMS.map((item) => item.category)))]
    }, [])

    const visibleItems = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase()

        return PET_SHOP_ITEMS.filter((item) => {
            const matchesCategory =
            selectedCategory === 'All' || item.category === selectedCategory

            const matchesSearch =
                normalizedSearch.length === 0 ||
                item.name.toLowerCase().includes(normalizedSearch) ||
                item.description.toLowerCase().includes(normalizedSearch) ||
                item.effect.toLowerCase().includes(normalizedSearch) ||
                item.category.toLowerCase().includes(normalizedSearch)

            return matchesCategory && matchesSearch
        })
    }, [selectedCategory, searchText])

    const buyItem = async (itemId: string) => {
        const item = PET_SHOP_ITEMS.find((shopItem) => shopItem.id === itemId)

        if (!item) return
        if (ownedItemIds.includes(item.id)) return
        
        const result = await window.desktopPet.purchaseItem({
            id: item.id,
            price: item.price
        })

        if (!result.success) {
            setShopMessage(result.reason ?? 'Purchase failed.')
            return
        }

        setCoins(result.save.currency)
        setOwnedItemIds((currentItems) => [...currentItems, item.id])
        setShopMessage(`Purchased ${item.name}!`)
    }

    return (
        <main className="shop-window">
            <div className="shop-titlebar">
                <div className="shop-titlebar-drag-region">
                <span className="shop-titlebar-icon">🐾</span>
                <span className="shop-titlebar-title">Pet Shop</span>
                </div>

                <div className="shop-titlebar-actions">
                <button 
                    type="button"
                    aria-label="Close shop"
                    onClick={() => window.desktopPet.closeShopWindow()}
                >
                    ×
                </button>
                </div>
            </div>

            {shopMessage && (
                <div className="shop-message">
                    {shopMessage}
                </div>
            )}

            <section className="shop-content">
                <header className="shop-header">
                    <div>
                    <h1>Pet Shop</h1>
                    <p>Buy items your pet can use later.</p>
                    </div>

                    <div className="coin-display">
                    <span className="coin-icon">●</span>
                    <span>{coins}</span>
                    </div>
                </header>

            <div className="shop-layout">
                <aside className="shop-sidebar">
                <div className="shop-sidebar-title">Categories</div>

                <nav className="shop-categories">
                    {categories.map((category) => (
                    <button
                        key={category}
                        className={category === selectedCategory ? 'active' : ''}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>
                    ))}
                </nav>
                </aside>

                <section className="shop-main">
                    <div className="shop-search-row">
                        <input
                            className="shop-search-input"
                            type="search"
                            placeholder="Search food, toys, care items..."
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                    </div>

                {visibleItems.length === 0 ? (
                    <div className="shop-empty-state">
                        No items found.
                    </div>
                ) : (
                    <section className="shop-grid">
                    {visibleItems.map((item) => {
                        const isOwned = ownedItemIds.includes(item.id)
                        const canAfford = coins >= item.price

                        return (
                        <article key={item.id} className="shop-card">
                            <div className="shop-card-icon">
                                {item.category === 'Food' && '🍎'}
                                {item.category === 'Drink' && '💧'}
                                {item.category === 'Toy' && '🎾'}
                                {item.category === 'Care' && '🧸'}
                            </div>

                            <div className="shop-card-body">
                                <div className="shop-card-topline">
                                    <h2>{item.name}</h2>
                                    <span>{item.category}</span>
                                </div>

                                <p>{item.description}</p>

                                <div className="shop-effect">{item.effect}</div>
                            </div>

                            <div className="shop-card-footer">
                                <div className="shop-price">{item.price} coins</div>

                                <button
                                    type="button"
                                    disabled={isOwned || !canAfford}
                                    onClick={() => buyItem(item.id)}
                                >
                                    {isOwned ? 'Owned' : canAfford ? 'Buy' : 'Not enough'}
                                </button>
                            </div>
                        </article>
                        )
                    })}
                    </section>
                )}
                </section>
            </div>
        </section>
        </main>
    )
}