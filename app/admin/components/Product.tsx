"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, ExternalLink, Edit, Trash2, Plus } from 'lucide-react'

interface ProductProps {
  products: any[]
  setProducts: (products: any[]) => void
  adminUser: any
}

export default function Product({ products, setProducts, adminUser }: ProductProps) {
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    image: "",
    downloadLink: "",
    demoLink: "",
    tags: ""
  })
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const addProduct = useCallback(async () => {
    try {
      if (!newProduct.title || !newProduct.price) {
        alert("Vui lòng nhập đầy đủ thông tin sản phẩm!")
        return
      }

      const product = {
        id: Date.now().toString(),
        ...newProduct,
        price: parseInt(newProduct.price),
        tags: newProduct.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        rating: 0,
        downloadCount: 0,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        createdBy: adminUser.email
      }

      const updatedProducts = [...products, product]
      setProducts(updatedProducts)
      localStorage.setItem("uploadedProducts", JSON.stringify(updatedProducts))

      setNewProduct({
        title: "",
        description: "",
        price: "",
        category: "",
        image: "",
        downloadLink: "",
        demoLink: "",
        tags: ""
      })

      alert("Thêm sản phẩm thành công!")
    } catch (error) {
      console.error("Error adding product:", error)
      alert("Có lỗi xảy ra khi thêm sản phẩm!")
    }
  }, [newProduct, products, adminUser, setProducts])

  const editProduct = useCallback(async (product: any) => {
    try {
      if (!product.title || !product.price) {
        alert("Vui lòng nhập đầy đủ thông tin sản phẩm!")
        return
      }

      const updatedProducts = products.map(p =>
        p.id === product.id ? {
          ...product,
          price: parseInt(product.price),
          tags: product.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean),
          updatedAt: new Date().toISOString(),
          updatedBy: adminUser.email
        } : p
      )

      setProducts(updatedProducts)
      localStorage.setItem("uploadedProducts", JSON.stringify(updatedProducts))
      setEditingProduct(null)
      alert("Cập nhật sản phẩm thành công!")
    } catch (error) {
      console.error("Error editing product:", error)
      alert("Có lỗi xảy ra khi cập nhật sản phẩm!")
    }
  }, [products, adminUser, setProducts])

  const deleteProduct = useCallback((productId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return

    try {
      const updatedProducts = products.filter(p => p.id !== productId)
      setProducts(updatedProducts)
      localStorage.setItem("uploadedProducts", JSON.stringify(updatedProducts))
      alert("Xóa sản phẩm thành công!")
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Có lỗi xảy ra khi xóa sản phẩm!")
    }
  }, [products, setProducts])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-white/60 dark:bg-gray-800/40">
          <CardHeader>
            <CardTitle>Thêm sản phẩm mới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Tên sản phẩm</Label>
              <Input
                id="title"
                value={newProduct.title}
                onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                placeholder="Nhập tên sản phẩm"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Mô tả sản phẩm"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="price">Giá (VNĐ)</Label>
              <Input
                id="price"
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="category">Danh mục</Label>
              <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Mobile App">Mobile App</SelectItem>
                  <SelectItem value="Game">Game</SelectItem>
                  <SelectItem value="Tool">Tool</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="image">Link hình ảnh</Label>
              <Input
                id="image"
                value={newProduct.image}
                onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="downloadLink">Link tải xuống</Label>
              <Input
                id="downloadLink"
                value={newProduct.downloadLink}
                onChange={(e) => setNewProduct({...newProduct, downloadLink: e.target.value})}
                placeholder="https://example.com/download"
              />
            </div>
            <div>
              <Label htmlFor="demoLink">Link demo</Label>
              <Input
                id="demoLink"
                value={newProduct.demoLink}
                onChange={(e) => setNewProduct({...newProduct, demoLink: e.target.value})}
                placeholder="https://example.com/demo"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
              <Input
                id="tags"
                value={newProduct.tags}
                onChange={(e) => setNewProduct({...newProduct, tags: e.target.value})}
                placeholder="react, nextjs, typescript"
              />
            </div>
            <Button onClick={addProduct} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </CardContent>
        </Card>

        {editingProduct && showEditModal && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Chỉnh sửa sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              <div>
                <Label htmlFor="edit-title">Tên sản phẩm</Label>
                <Input
                  id="edit-title"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                  placeholder="Nhập tên sản phẩm"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  placeholder="Mô tả sản phẩm"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Giá (VNĐ)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Danh mục</Label>
                <Select value={editingProduct.category} onValueChange={(value) => setEditingProduct({...editingProduct, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Mobile App">Mobile App</SelectItem>
                    <SelectItem value="Game">Game</SelectItem>
                    <SelectItem value="Tool">Tool</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-image">Link hình ảnh</Label>
                <Input
                  id="edit-image"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="edit-downloadLink">Link tải xuống</Label>
                <Input
                  id="edit-downloadLink"
                  value={editingProduct.downloadLink}
                  onChange={(e) => setEditingProduct({...editingProduct, downloadLink: e.target.value})}
                  placeholder="https://example.com/download"
                />
              </div>
              <div>
                <Label htmlFor="edit-demoLink">Link demo</Label>
                <Input
                  id="edit-demoLink"
                  value={editingProduct.demoLink}
                  onChange={(e) => setEditingProduct({...editingProduct, demoLink: e.target.value})}
                  placeholder="https://example.com/demo"
                />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (phân cách bằng dấu phẩy)</Label>
                <Input
                  id="edit-tags"
                  value={editingProduct.tags?.join(", ") || ""}
                  onChange={(e) => setEditingProduct({...editingProduct, tags: e.target.value.split(",").map(tag => tag.trim())})}
                  placeholder="react, nextjs, typescript"
                />
              </div>
              
              {/* Rating */}
              <div>
                <Label htmlFor="edit-rating">Đánh giá (0-5 sao)</Label>
                <Input
                  id="edit-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={editingProduct.rating || 0}
                  onChange={(e) => setEditingProduct({...editingProduct, rating: parseFloat(e.target.value)})}
                  placeholder="0"
                />
              </div>

              {/* Download Count */}
              <div>
                <Label htmlFor="edit-downloadCount">Lượt tải về</Label>
                <Input
                  id="edit-downloadCount"
                  type="number"
                  min="0"
                  value={editingProduct.downloadCount || 0}
                  onChange={(e) => setEditingProduct({...editingProduct, downloadCount: parseInt(e.target.value)})}
                  placeholder="0"
                />
              </div>

              {/* Is Featured */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isFeatured"
                  checked={editingProduct.isFeatured || false}
                  onChange={(e) => setEditingProduct({...editingProduct, isFeatured: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-isFeatured" className="cursor-pointer">
                  Hiển thị nổi bật trên trang chủ
                </Label>
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => {
                  editProduct(editingProduct)
                  setShowEditModal(false)
                }} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Cập nhật sản phẩm
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingProduct(null)
                    setShowEditModal(false)
                  }}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2 bg-white/60 dark:bg-gray-800/40">
          <CardHeader>
            <CardTitle>Danh sách sản phẩm ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{product.title}</h3>
                      {product.isFeatured && (
                        <Badge className="bg-yellow-500 text-white text-xs">⭐ Nổi bật</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.description?.slice(0, 100)}...
                    </p>
                    <div className="flex items-center space-x-2 mt-2 flex-wrap">
                      <Badge>{product.category}</Badge>
                      <span className="text-sm font-medium text-green-600">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                      {product.rating && (
                        <span className="text-sm text-yellow-500 flex items-center">
                          ⭐ {product.rating.toFixed(1)}
                        </span>
                      )}
                      {product.downloadCount !== undefined && (
                        <span className="text-sm text-gray-500">
                          📥 {product.downloadCount} lượt tải
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {product.downloadLink && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={product.downloadLink} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {product.demoLink && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={product.demoLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingProduct({...product})
                        setShowEditModal(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có sản phẩm nào
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}