import type {
  ShopData,
  ShopItem,
  ShopItemTemplate,
  ShopRefreshResult,
  ShopRarity,
  ShopPurchaseRecord
} from '../types'
import {
  SHOP_ITEMS,
  SHOP_CONFIG,
  RARITY_COLORS,
  getShopItemsByStage
} from '../data/shopData'

export type PurchaseResult =
  | { success: true; item: ShopItem; quantity: number; totalPrice: number }
  | { success: false; reason: string }

export class ShopManager {
  private static instance: ShopManager

  static getInstance(): ShopManager {
    if (!ShopManager.instance) {
      ShopManager.instance = new ShopManager()
    }
    return ShopManager.instance
  }

  createInitialShopData(): ShopData {
    return {
      items: [],
      lastRefreshTime: 0,
      refreshCount: 0,
      dailyRefreshCount: 0,
      lastDailyReset: 0,
      purchaseHistory: [],
      totalSpent: 0,
      rareItemsFound: 0
    }
  }

  validateShopData(data: ShopData | undefined): ShopData {
    if (!data) {
      return this.createInitialShopData()
    }
    if (!data.items) data.items = []
    if (!data.purchaseHistory) data.purchaseHistory = []
    if (data.refreshCount === undefined) data.refreshCount = 0
    if (data.dailyRefreshCount === undefined) data.dailyRefreshCount = 0
    if (data.lastRefreshTime === undefined) data.lastRefreshTime = 0
    if (data.lastDailyReset === undefined) data.lastDailyReset = 0
    if (data.totalSpent === undefined) data.totalSpent = 0
    if (data.rareItemsFound === undefined) data.rareItemsFound = 0

    this.checkDailyReset(data)
    return data
  }

  checkDailyReset(shop: ShopData): void {
    const now = Date.now()
    const lastReset = new Date(shop.lastDailyReset)
    const today = new Date()

    if (lastReset.toDateString() !== today.toDateString()) {
      shop.dailyRefreshCount = 0
      shop.lastDailyReset = now
    }
  }

  canRefresh(shop: ShopData): { canRefresh: boolean; reason?: string; costGold?: number } {
    const freeRefreshesLeft = SHOP_CONFIG.dailyFreeRefreshes - shop.dailyRefreshCount

    if (freeRefreshesLeft > 0) {
      return { canRefresh: true }
    }

    return {
      canRefresh: true,
      costGold: SHOP_CONFIG.paidRefreshGoldCost
    }
  }

  refreshShop(shop: ShopData, currentStage: number, gold: number): ShopRefreshResult {
    this.checkDailyReset(shop)

    const freeRefreshesLeft = SHOP_CONFIG.dailyFreeRefreshes - shop.dailyRefreshCount
    if (freeRefreshesLeft <= 0 && gold < SHOP_CONFIG.paidRefreshGoldCost) {
      return {
        items: shop.items,
        rareItems: [],
        message: '金币不足，无法刷新商品！'
      }
    }

    const availableItems = getShopItemsByStage(currentStage)
    const selectedItems: ShopItem[] = []
    const rareItems: ShopItem[] = []
    const usedTemplateIds = new Set<string>()

    const weightedItems = availableItems.map(item => ({
      item,
      weight: item.spawnWeight * this.getRarityWeightMultiplier(item.rarity)
    }))

    const totalWeight = weightedItems.reduce((sum, w) => sum + w.weight, 0)

    for (let i = 0; i < SHOP_CONFIG.maxItemsPerRefresh; i++) {
      const item = this.selectWeightedItem(weightedItems, totalWeight, usedTemplateIds)
      if (item) {
        const shopItem = this.createShopItem(item)
        selectedItems.push(shopItem)
        usedTemplateIds.add(item.id)

        if (item.rarity === 'epic' || item.rarity === 'legendary') {
          rareItems.push(shopItem)
          shop.rareItemsFound++
        }
      }
    }

    if (Math.random() < SHOP_CONFIG.rareItemBonusChance) {
      const rareTemplates = availableItems.filter(
        item => item.rarity === 'epic' && !usedTemplateIds.has(item.id)
      )
      if (rareTemplates.length > 0) {
        const template = rareTemplates[Math.floor(Math.random() * rareTemplates.length)]
        const shopItem = this.createShopItem(template, true)
        selectedItems.push(shopItem)
        rareItems.push(shopItem)
        shop.rareItemsFound++
      }
    }

    if (Math.random() < SHOP_CONFIG.legendaryItemBonusChance) {
      const legendaryTemplates = availableItems.filter(
        item => item.rarity === 'legendary' && !usedTemplateIds.has(item.id)
      )
      if (legendaryTemplates.length > 0) {
        const template = legendaryTemplates[Math.floor(Math.random() * legendaryTemplates.length)]
        const shopItem = this.createShopItem(template, true)
        selectedItems.push(shopItem)
        rareItems.push(shopItem)
        shop.rareItemsFound++
      }
    }

    shop.items = selectedItems
    shop.lastRefreshTime = Date.now()
    shop.refreshCount++

    if (freeRefreshesLeft > 0) {
      shop.dailyRefreshCount++
      return {
        items: selectedItems,
        rareItems,
        message: rareItems.length > 0
          ? `刷新成功！发现 ${rareItems.length} 件稀有货品！`
          : '刷新成功！今日免费刷新还剩 ' + (SHOP_CONFIG.dailyFreeRefreshes - shop.dailyRefreshCount) + ' 次。'
      }
    } else {
      return {
        items: selectedItems,
        rareItems,
        message: rareItems.length > 0
          ? `刷新成功！发现 ${rareItems.length} 件稀有货品！（消耗 ${SHOP_CONFIG.paidRefreshGoldCost} 金币）`
          : `刷新成功！（消耗 ${SHOP_CONFIG.paidRefreshGoldCost} 金币）`
      }
    }
  }

  getRefreshCost(shop: ShopData): number | null {
    const freeRefreshesLeft = SHOP_CONFIG.dailyFreeRefreshes - shop.dailyRefreshCount
    if (freeRefreshesLeft > 0) {
      return null
    }
    return SHOP_CONFIG.paidRefreshGoldCost
  }

  getFreeRefreshesLeft(shop: ShopData): number {
    return Math.max(0, SHOP_CONFIG.dailyFreeRefreshes - shop.dailyRefreshCount)
  }

  purchaseItem(
    shop: ShopData,
    itemId: string,
    quantity: number,
    gold: number
  ): PurchaseResult {
    const shopItem = shop.items.find(item => item.id === itemId)

    if (!shopItem) {
      return { success: false, reason: '商品不存在！' }
    }

    if (shopItem.stock < quantity) {
      return { success: false, reason: '库存不足！' }
    }

    const totalPrice = shopItem.currentPrice * quantity

    if (gold < totalPrice) {
      return { success: false, reason: '金币不足！' }
    }

    shopItem.stock -= quantity
    shop.totalSpent += totalPrice

    const record: ShopPurchaseRecord = {
      itemId: shopItem.templateId,
      itemName: shopItem.name,
      price: shopItem.currentPrice,
      purchaseTime: Date.now(),
      quantity
    }
    shop.purchaseHistory.push(record)

    if (shop.purchaseHistory.length > 100) {
      shop.purchaseHistory = shop.purchaseHistory.slice(-100)
    }

    return {
      success: true,
      item: shopItem,
      quantity,
      totalPrice
    }
  }

  private createShopItem(template: ShopItemTemplate, isRareStock: boolean = false): ShopItem {
    const priceFluctuation = this.calculatePriceFluctuation()
    const currentPrice = Math.floor(template.basePrice * (1 + priceFluctuation))

    const stock = isRareStock
      ? 1
      : Math.floor(template.maxStock * (0.5 + Math.random() * 0.5))

    return {
      id: `shop_item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      templateId: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      rarity: template.rarity,
      icon: template.icon,
      color: template.color,
      basePrice: template.basePrice,
      currentPrice,
      priceFluctuation,
      stock: Math.max(1, stock),
      maxStock: template.maxStock,
      isRareStock,
      effects: template.effects
    }
  }

  private calculatePriceFluctuation(): number {
    const range = SHOP_CONFIG.priceFluctuationRange
    return (Math.random() * 2 - 1) * range
  }

  private getRarityWeightMultiplier(rarity: ShopRarity): number {
    switch (rarity) {
      case 'common':
        return 3
      case 'uncommon':
        return 2
      case 'rare':
        return 1
      case 'epic':
        return 0.3
      case 'legendary':
        return 0.1
      default:
        return 1
    }
  }

  private selectWeightedItem(
    weightedItems: { item: ShopItemTemplate; weight: number }[],
    totalWeight: number,
    usedIds: Set<string>
  ): ShopItemTemplate | null {
    const availableItems = weightedItems.filter(w => !usedIds.has(w.item.id))
    if (availableItems.length === 0) return null

    const availableWeight = availableItems.reduce((sum, w) => sum + w.weight, 0)
    let random = Math.random() * availableWeight

    for (const weighted of availableItems) {
      random -= weighted.weight
      if (random <= 0) {
        return weighted.item
      }
    }

    return availableItems[availableItems.length - 1].item
  }

  getPurchaseHistory(shop: ShopData, limit: number = 20): ShopPurchaseRecord[] {
    return shop.purchaseHistory.slice(-limit).reverse()
  }

  getShopStats(shop: ShopData): {
    totalSpent: number
    refreshCount: number
    rareItemsFound: number
    purchaseCount: number
  } {
    return {
      totalSpent: shop.totalSpent,
      refreshCount: shop.refreshCount,
      rareItemsFound: shop.rareItemsFound,
      purchaseCount: shop.purchaseHistory.length
    }
  }
}
