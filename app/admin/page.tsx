"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Shield, LogOut } from 'lucide-react'
import { Logo } from "@/components/logo"
import { getUserData, saveUserData, onUsersChange, saveDeposit, saveWithdrawal, onDepositsChange, onWithdrawalsChange, onPurchasesChange, saveNotification, getDeposits, getWithdrawals } from "@/lib/auth"
import { ThreeJSAdmin } from "@/components/three-js-admin"
import { ThreeDFallback } from "@/components/3d-fallback"

// Import các component riêng biệt
import { Overview } from "./components/Overview"
import Product from "./components/Product"
import { User } from "./components/User"
import { Deposit } from "./components/Deposit"
import { Withdrawmoney } from "./components/Withdrawmoney"
import { Analytics } from "./components/Analytics"
import { CustomerSupport } from "./components/CustomerSupport"
import { Setting } from "./components/Setting"

export default function AdminPage() {
  const router = useRouter()
  const [adminUser, setAdminUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Data states
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([])
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  
  // Form states
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
  
  // UI states
  const [activeTab, setActiveTab] = useState("overview")
  const [processingDeposit, setProcessingDeposit] = useState<string | null>(null)
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null)

  // Load data function
  const loadData = useCallback(() => {
    try {
      // Load products from localStorage (unchanged)
      const loadedProducts = JSON.parse(localStorage.getItem("uploadedProducts") || "[]")
      setProducts(loadedProducts)

      // Load notifications from localStorage (unchanged)
      const loadedNotifications = JSON.parse(localStorage.getItem("adminNotifications") || "[]")
      setNotifications(loadedNotifications)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }, [])

  // Check admin authentication
  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminAuth") === "true"
    const adminUserStr = localStorage.getItem("adminUser")
    
    if (!isAdminLoggedIn || !adminUserStr) {
      router.push("/admin/login")
      return
    }

    setAdminUser(JSON.parse(adminUserStr))
    setIsLoading(false)
  }, [router])

  // Load data on mount and when tab changes with real-time updates
  useEffect(() => {
    if (!isLoading && adminUser) {
      loadData()
      
      // Load users using comprehensive getUserData from auth.ts
      const unsubscribeUsers = onUsersChange((loadedUsers) => {
        console.log('📊 Admin: Users updated via real-time:', loadedUsers.length)
        setUsers(loadedUsers.map(user => ({
          ...user,
          registrationTime: user.createdAt || user.joinDate || new Date().toISOString(),
          totalSpent: 0,
          // Ensure all required fields are present
          uid: user.uid || user.id,
          email: user.email,
          name: user.name || user.displayName,
          provider: user.provider || 'email',
          balance: user.balance || 0,
          loginCount: user.loginCount || 1,
          lastLogin: user.lastLogin || user.lastActivity,
          ipAddress: user.ipAddress || 'Unknown',
          status: user.status || 'active'
        })))
      });
      
      // Immediately fetch and set users to avoid waiting for the first real-time update
      const initialUsers = getUserData();
      console.log('📊 Admin: Initial users loaded:', initialUsers.length)
      setUsers(initialUsers.map((user: any) => ({
        ...user,
        registrationTime: user.createdAt || user.joinDate || new Date().toISOString(),
        totalSpent: 0,
        // Ensure all required fields are present
        uid: user.uid || user.id,
        email: user.email,
        name: user.name || user.displayName,
        provider: user.provider || 'email',
        balance: user.balance || 0,
        loginCount: user.loginCount || 1,
        lastLogin: user.lastLogin || user.lastActivity,
        ipAddress: user.ipAddress || 'Unknown',
        status: user.status || 'active'
      })));

      // Load deposits with enhanced user data
      const unsubscribeDeposits = onDepositsChange((loadedDeposits) => {
        const currentUsers = getUserData()
        setPendingDeposits(loadedDeposits.map(deposit => {
          const user = currentUsers.find((u: any) => u.uid === deposit.user_id) || 
                      currentUsers.find((u: any) => u.email === deposit.userEmail)
          return {
            ...deposit,
            requestTimeFormatted: new Date(deposit.timestamp).toLocaleString('vi-VN'),
            userName: user?.name || user?.displayName || deposit.userName || "Unknown User",
            userEmail: user?.email || deposit.userEmail || "Unknown Email",
            userBalance: user?.balance || 0,
            userStatus: user?.status || "unknown"
          }
        }))
      })

      // Load withdrawals with enhanced user data
      const unsubscribeWithdrawals = onWithdrawalsChange((loadedWithdrawals) => {
        const currentUsers = getUserData()
        setPendingWithdrawals(loadedWithdrawals.map(withdrawal => {
          const user = currentUsers.find((u: any) => u.uid === withdrawal.user_id) ||
                      currentUsers.find((u: any) => u.email === withdrawal.userEmail)
          return {
            ...withdrawal,
            requestTimeFormatted: new Date(withdrawal.timestamp).toLocaleString('vi-VN'),
            userName: user?.name || user?.displayName || withdrawal.userName || "Unknown User",
            userEmail: user?.email || withdrawal.userEmail || "Unknown Email",
            userBalance: user?.balance || 0,
            userStatus: user?.status || "unknown",
            receiveAmount: withdrawal.amount * 0.95
          }
        }))
      })

      // Load purchases
      const unsubscribePurchases = onPurchasesChange((loadedPurchases) => {
        setPurchases(loadedPurchases.map(purchase => ({
          ...purchase,
          title: "Unknown Product",
          purchaseDate: purchase.timestamp
        })))
      })

      return () => {
        unsubscribeUsers()
        unsubscribeDeposits()
        unsubscribeWithdrawals()
        unsubscribePurchases()
      }
    }
  }, [isLoading, adminUser])

  // Real-time auto-refresh data every 5 seconds for better responsiveness
  useEffect(() => {
    if (!isLoading && adminUser) {
      const interval = setInterval(() => {
        loadData()
        // Trigger manual reload of deposits and withdrawals for real-time sync
        const currentUsers = getUserData()
        const currentDeposits = getDeposits()
        const currentWithdrawals = getWithdrawals()
        
        // Update deposits with latest user info
        setPendingDeposits(currentDeposits.map((deposit: any) => {
          const user = currentUsers.find((u: any) => u.uid === deposit.user_id) || 
                      currentUsers.find((u: any) => u.email === deposit.userEmail)
          return {
            ...deposit,
            requestTimeFormatted: new Date(deposit.timestamp).toLocaleString('vi-VN'),
            userName: user?.name || user?.displayName || deposit.userName || "Unknown User",
            userEmail: user?.email || deposit.userEmail || "Unknown Email",
            userBalance: user?.balance || 0,
            userStatus: user?.status || "unknown"
          }
        }))
        
        // Update withdrawals with latest user info
        setPendingWithdrawals(currentWithdrawals.map((withdrawal: any) => {
          const user = currentUsers.find((u: any) => u.uid === withdrawal.user_id) ||
                      currentUsers.find((u: any) => u.email === withdrawal.userEmail)
          return {
            ...withdrawal,
            requestTimeFormatted: new Date(withdrawal.timestamp).toLocaleString('vi-VN'),
            userName: user?.name || user?.displayName || withdrawal.userName || "Unknown User",
            userEmail: user?.email || withdrawal.userEmail || "Unknown Email",
            userBalance: user?.balance || 0,
            userStatus: user?.status || "unknown",
            receiveAmount: withdrawal.amount * 0.95
          }
        }))
      }, 5000) // Reduced from 10 seconds to 5 seconds for better real-time experience
      
      return () => clearInterval(interval)
    }
  }, [isLoading, adminUser, loadData])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminAuth")
    localStorage.removeItem("adminUser")
    router.push("/admin/login")
  }, [router])

  // Product management functions
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
  }, [newProduct, products, adminUser])

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
  }, [products, adminUser])

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
  }, [products])

  // Enhanced Deposit/Withdrawal management functions with account independence
  
  const approveDeposit = useCallback(async (depositId: string) => {
    if (processingDeposit) return;
    setProcessingDeposit(depositId);

    try {
      const deposit = pendingDeposits.find((d) => d.id === depositId);
      if (!deposit) {
        alert("Không tìm thấy yêu cầu nạp tiền!");
        return;
      }

      // Call the function to process the deposit approval
      await processDepositApproval(deposit, adminUser);

      alert("Nạp tiền thành công!");
    } catch (error) {
      console.error("Error approving deposit:", error);
      alert("Có lỗi xảy ra khi duyệt nạp tiền!");
    } finally {
      setProcessingDeposit(null);
    }
  }, [pendingDeposits, adminUser, processingDeposit]);

  // Function to process the deposit approval
  const processDepositApproval = async (deposit: any, adminUser: any) => {
    try {
      // Call the API to approve the deposit
      const response = await fetch('/api/admin/approve-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId: deposit.id,
          amount: deposit.amount,
          userId: deposit.user_id,
          action: 'approve',
        }),
      });

      const result = await response.json();
      if (!result.success) {
        alert(`Lỗi khi duyệt nạp tiền: ${result.error}`);
        return;
      }

      // Update local state
      const allUsers = getUserData();
      const targetUser = allUsers.find((u: any) => u.email === deposit.userEmail || u.uid === deposit.user_id);
      if (!targetUser) {
        console.error(`Không tìm thấy người dùng! UID: ${deposit.user_id || 'không xác định'}, Email: ${deposit.userEmail}`);
        alert(`Không tìm thấy người dùng! UID: ${deposit.user_id || 'không xác định'}, Email: ${deposit.userEmail}`);
        return;
      }

      const updatedUser = {
        ...targetUser,
        balance: (targetUser.balance || 0) + deposit.amount,
        lastActivity: new Date().toISOString(),
        lastDepositAmount: deposit.amount,
        lastDepositTime: new Date().toISOString(),
      };

      const updatedUsers = allUsers.map((u: any) =>
        u.uid === deposit.user_id || u.email === deposit.userEmail ? updatedUser : u
      );
      saveUserData(updatedUsers);
      setUsers(updatedUsers);

      const approvedDeposit = {
        ...deposit,
        status: 'approved',
        approvedTime: new Date().toISOString(),
        approvedBy: adminUser.email,
        previousBalance: targetUser.balance || 0,
        newBalance: updatedUser.balance,
        userAccountId: targetUser.uid,
        processed: true,
      };

      // Save updated deposit
      saveDeposit(approvedDeposit);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('depositsChange', { detail: [...getDeposits().filter((d: any) => d.id !== deposit.id), approvedDeposit] }));
      }

      // Send Telegram notification
      try {
        const telegramMessage = `✅ <b>NẠP TIỀN ĐÃ ĐƯỢC DUYỆT</b>

👤 <b>Khách hàng:</b> ${deposit.userName}
📧 <b>Email:</b> ${deposit.userEmail}
💰 <b>Số tiền:</b> ${deposit.amount.toLocaleString('vi-VN')}đ
🏦 <b>Phương thức:</b> ${deposit.method}
📝 <b>Mã GD:</b> ${deposit.transactionId}
✅ <b>Duyệt bởi:</b> ${adminUser.email}
⏰ <b>Thời gian duyệt:</b> ${new Date().toLocaleString('vi-VN')}

<i>Số dư đã được cộng vào tài khoản khách hàng!</i>`

        await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: 'HTML'
          })
        })

        await saveNotification({
          type: "deposit_approved",
          title: "Nạp tiền đã được duyệt",
          message: telegramMessage,
          user: { email: deposit.userEmail, name: deposit.userName },
          admin: { email: adminUser.email, name: adminUser.name, loginTime: adminUser.loginTime },
          timestamp: new Date().toISOString(),
          device: "Admin Panel",
          ip: "Unknown",
          read: false
        })
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError)
      }
    } catch (error) {
      console.error("Error in processDepositApproval:", error);
      throw error; // Re-throw the error to be caught by the main function
    }
  };

  const rejectDeposit = useCallback(async (depositId: string) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối yêu cầu này?")) return;

    try {
      const deposit = pendingDeposits.find(d => d.id === depositId);
      if (!deposit) {
        alert("Không tìm thấy yêu cầu nạp tiền!");
        return;
      }

      await processDepositRejection(deposit);

      alert("Đã từ chối yêu cầu nạp tiền!");
    } catch (error) {
      console.error("Error rejecting deposit:", error);
      alert("Có lỗi xảy ra!");
    }
  }, [pendingDeposits, adminUser, loadData]);

  const processDepositRejection = async (deposit: any) => {
    try {
      const updatedDeposit = { ...deposit, status: "rejected" };
      await saveDeposit(updatedDeposit);
    } catch (error) {
      console.error("Error in processDepositRejection:", error);
      throw error;
    }
  };

  const approveWithdrawal = useCallback(async (withdrawalId: string) => {
    if (processingWithdrawal) return;
    setProcessingWithdrawal(withdrawalId);

    try {
      const withdrawal = pendingWithdrawals.find(w => w.id.toString() === withdrawalId);
      if (!withdrawal) {
        alert("Không tìm thấy yêu cầu rút tiền!");
        return;
      }

      await processWithdrawalApproval(withdrawal, adminUser);

      alert("Duyệt rút tiền thành công!");
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      alert("Có lỗi xảy ra khi duyệt rút tiền!");
    } finally {
      setProcessingWithdrawal(null);
    }
  }, [pendingWithdrawals, adminUser, processingWithdrawal, loadData]);

  const processWithdrawalApproval = async (withdrawal: any, adminUser: any) => {
    try {
      // Get all users and find the specific user for this withdrawal
      const allUsers = getUserData();
      const targetUser = allUsers.find((u: any) =>
        u.uid === withdrawal.user_id || u.email === withdrawal.userEmail
      );

      if (!targetUser) {
        alert("Không tìm thấy người dùng! User ID: " + withdrawal.user_id);
        return;
      }

      // Check if user has sufficient balance for this specific account
      if ((targetUser.balance || 0) < withdrawal.amount) {
        alert(`Số dư không đủ để duyệt rút tiền!\nSố dư hiện tại: ${(targetUser.balance || 0).toLocaleString('vi-VN')}đ\nSố tiền rút: ${withdrawal.amount.toLocaleString('vi-VN')}đ`);
        return;
      }

      // Update specific user balance independently - each account operates separately
      const updatedUser = {
        ...targetUser,
        balance: (targetUser.balance || 0) - withdrawal.amount,
        lastActivity: new Date().toISOString(),
        lastWithdrawalAmount: withdrawal.amount,
        lastWithdrawalTime: new Date().toISOString()
      };

      // Update user in the users array while preserving other users
      const updatedUsers = allUsers.map((u: any) =>
        (u.uid === withdrawal.user_id || u.email === withdrawal.userEmail) ? updatedUser : u
      );

      // Save updated users array
      saveUserData(updatedUsers);

      // Update withdrawal status with detailed information
      const approvedWithdrawal = {
        ...withdrawal,
        status: "approved",
        approvedTime: new Date().toISOString(),
        approvedBy: adminUser.email,
        previousBalance: targetUser.balance || 0,
        newBalance: updatedUser.balance,
        userAccountId: targetUser.uid,
        processed: true
      };

      // Save updated withdrawal
      const allWithdrawals = getWithdrawals();
      const updatedWithdrawals = allWithdrawals.map((w: any) =>
        w.id.toString() === withdrawal.id.toString() ? approvedWithdrawal : w
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('withdrawals', JSON.stringify(updatedWithdrawals));
        window.dispatchEvent(new CustomEvent('withdrawalsChange', { detail: updatedWithdrawals }));
      }

      // Send Telegram notification for withdrawal approval
      try {
        const telegramMessage = `💸 <b>RÚT TIỀN ĐÃ ĐƯỢC DUYỆT</b>

👤 <b>Khách hàng:</b> ${withdrawal.userName}
📧 <b>Email:</b> ${withdrawal.userEmail}
💰 <b>Số tiền rút:</b> ${withdrawal.amount.toLocaleString('vi-VN')}đ
💵 <b>Nhận thực tế:</b> ${(withdrawal.amount * 0.95).toLocaleString('vi-VN')}đ
🏦 <b>Ngân hàng:</b> ${withdrawal.bankName}
📝 <b>STK:</b> ${withdrawal.accountNumber}
👨‍💼 <b>Tên TK:</b> ${withdrawal.accountName}
📊 <b>Số dư trước:</b> ${(targetUser.balance || 0).toLocaleString('vi-VN')}đ
📊 <b>Số dư sau:</b> ${updatedUser.balance.toLocaleString('vi-VN')}đ
✅ <b>Duyệt bởi:</b> ${adminUser.email}
⏰ <b>Thời gian duyệt:</b> ${new Date().toLocaleString('vi-VN')}

<i>Vui lòng chuyển khoản cho khách hàng!</i>`;

        await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: 'HTML'
          })
        });

        await saveNotification({
          type: "withdrawal_approved",
          title: "Rút tiền đã được duyệt",
          message: telegramMessage,
          user: { email: withdrawal.userEmail, name: withdrawal.userName },
          admin: { email: adminUser.email, name: adminUser.name, loginTime: adminUser.loginTime },
          timestamp: new Date().toISOString(),
          device: "Admin Panel",
          ip: "Unknown",
          read: false
        });
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError);
      }
    } catch (error) {
      console.error("Error in processWithdrawalApproval:", error);
      throw error;
    }
  };

  const rejectWithdrawal = useCallback(async (withdrawalId: string) => {
    if (!confirm("Bạn có chắc chắn muốn từ chối yêu cầu này?")) return;

    try {
      const withdrawal = pendingWithdrawals.find(w => w.id.toString() === withdrawalId);
      if (!withdrawal) {
        alert("Không tìm thấy yêu cầu rút tiền!");
        return;
      }

      await processWithdrawalRejection(withdrawal);

      alert("Đã từ chối yêu cầu rút tiền!");
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      alert("Có lỗi xảy ra!");
    }
  }, [pendingWithdrawals, adminUser, loadData]);

  const processWithdrawalRejection = async (withdrawal: any) => {
    try {
      const updatedWithdrawal = { ...withdrawal, status: "rejected" };
      await saveWithdrawal(updatedWithdrawal);
    } catch (error) {
      console.error("Error in processWithdrawalRejection:", error);
      throw error;
    }
  };

  // Enhanced User management functions with account independence
  const updateUserStatus = useCallback(async (userId: string, newStatus: string) => {
    try {
      // Get all users and find the specific user
      const allUsers = getUserData()
      const targetUser = allUsers.find((u: any) => u.uid === userId)
      
      if (!targetUser) {
        alert("Không tìm thấy người dùng!")
        return
      }

      const updatedUser = { 
        ...targetUser, 
        status: newStatus, 
        lastStatusChange: new Date().toISOString(),
        statusChangedBy: adminUser.email 
      }
      
      // Update user while preserving other users' independence
      const updatedUsers = allUsers.map((u: any) => 
        u.uid === userId ? updatedUser : u
      )
      
      saveUserData(updatedUsers)
      setUsers(updatedUsers)
      
      alert(`Đã ${newStatus === "active" ? "kích hoạt" : "khóa"} tài khoản!`)
    } catch (error) {
      console.error("Error updating user status:", error)
      alert("Có lỗi xảy ra!")
    }
  }, [users, adminUser])

  const updateUserBalance = useCallback(async (userId: string, newBalance: number) => {
    if (newBalance < 0) {
      alert("Số dư không thể âm!")
      return
    }

    try {
      // Get all users and find the specific user
      const allUsers = getUserData()
      const targetUser = allUsers.find((u: any) => u.uid === userId)
      
      if (!targetUser) {
        alert("Không tìm thấy người dùng!")
        return
      }

      const updatedUser = { 
        ...targetUser, 
        balance: newBalance,
        lastBalanceUpdate: new Date().toISOString(),
        balanceUpdatedBy: adminUser.email,
        previousBalance: targetUser.balance || 0
      }
      
      // Update user while preserving other users' independence
      const updatedUsers = allUsers.map((u: any) => 
        u.uid === userId ? updatedUser : u
      )
      
      saveUserData(updatedUsers)
      setUsers(updatedUsers)
      
      // Log balance change for audit trail
      await saveNotification({
        type: "balance_updated",
        title: "Số dư được cập nhật",
        message: `Admin ${adminUser.email} đã cập nhật số dư cho ${targetUser.name} từ ${(targetUser.balance || 0).toLocaleString('vi-VN')}đ thành ${newBalance.toLocaleString('vi-VN')}đ`,
        user: { email: targetUser.email, name: targetUser.name },
        admin: { email: adminUser.email, name: adminUser.name, loginTime: adminUser.loginTime },
        timestamp: new Date().toISOString(),
        device: "Admin Panel",
        ip: "Unknown",
        read: false
      })
      
      alert("Cập nhật số dư thành công!")
    } catch (error) {
      console.error("Error updating user balance:", error)
      alert("Có lỗi xảy ra!")
    }
  }, [users, adminUser])

//Analytics
  // (Analytics component is imported but not used in this snippet)
  // (CustomerSupport component is imported but not used in this snippet)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [supportTickets, setSupportTickets] = useState<any[]>([])

  // You can implement analytics and customer support functionalities here as needed
  const fetchAnalyticsData = useCallback(() => {
    // Fetch and set analytics data
  }, [])

  // Fetch support tickets
  const fetchSupportTickets = useCallback(() => {
    // Fetch and set support tickets
  }, [])
  // Setting functions
  const testTelegramNotification = useCallback(async () => {
    try {
      const testMessage = `🔔 <b>TEST THÔNG BÁO TELEGRAM</b>

✅ Kết nối Telegram Bot thành công!
⏰ Thời gian test: ${new Date().toLocaleString('vi-VN')}
👨‍💻 Test bởi: ${adminUser.email}

<i>Hệ thống thông báo đang hoạt động bình thường.</i>`

      const response = await fetch(`https://api.telegram.org/bot${process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID,
          text: testMessage,
          parse_mode: 'HTML'
        })
      })

      if (response.ok) {
        await saveNotification({
          type: "test_notification",
          title: "Test Telegram Notification",
          message: testMessage,
          admin: { email: adminUser.email, name: adminUser.name, loginTime: adminUser.loginTime },
          timestamp: new Date().toISOString(),
          device: "Admin Panel",
          ip: "Unknown",
          read: false
        })
        alert("✅ Gửi thông báo Telegram thành công!")
      } else {
        alert("❌ Lỗi khi gửi thông báo Telegram!")
      }
    } catch (error) {
      console.error("Telegram test error:", error)
      alert("❌ Lỗi kết nối Telegram!")
    }
  }, [adminUser])

  const testWhatsAppNotification = useCallback(() => {
    try {
      const testMessage = `🔔 TEST THÔNG BÁO WHATSAPP

✅ Kết nối WhatsApp thành công!
⏰ Thời gian test: ${new Date().toLocaleString('vi-VN')}
👨‍💻 Test bởi: ${adminUser.email}

Hệ thống thông báo đang hoạt động bình thường.`

      const encodedMessage = encodeURIComponent(testMessage)
      const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER}?text=${encodedMessage}`
      
      window.open(whatsappUrl, '_blank')
      alert("✅ Đã mở WhatsApp! Vui lòng gửi tin nhắn để test.")
    } catch (error) {
      console.error("WhatsApp test error:", error)
      alert("❌ Lỗi khi mở WhatsApp!")
    }
  }, [adminUser])

  // Calculate stats
  const getStats = useCallback(() => {
    const totalUsers = users.length
    const totalProducts = products.length
    const totalRevenue = purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0)
    const pendingDepositsCount = pendingDeposits.filter(d => d.status !== "rejected").length
    const pendingWithdrawalsCount = pendingWithdrawals.filter(w => w.status !== "rejected").length
    const newUsersCount = users.filter(user => {
      const registrationDate = new Date(user.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - registrationDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    }).length
    
    return {
      totalUsers,
      totalProducts,
      totalRevenue,
      pendingDepositsCount,
      pendingWithdrawalsCount,
      totalPurchases: purchases.length,
      newUsersCount
    }
  }, [users, products, purchases, pendingDeposits, pendingWithdrawals])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <p className="mt-4 text-muted-foreground">Đang tải Admin Panel...</p>
        </div>
      </div>
    )
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Logo />
          <p className="mt-4 text-muted-foreground">Vui lòng đăng nhập Admin</p>
          <Button 
            onClick={() => router.push("/admin/login")}
            className="mt-4"
          >
            Đăng nhập Admin
          </Button>
        </div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-background relative">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <ThreeJSAdmin />
        <ThreeDFallback />
      </div>
      
      <div className="border-b relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">
                  Chào mừng, {adminUser.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="users">
            Người dùng
            {stats.newUsersCount > 0 && (
          <Badge className="ml-2 bg-blue-600 text-white text-xs shadow-md">
            {stats.newUsersCount} mới
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="deposits">
        Nạp tiền
        {stats.pendingDepositsCount > 0 && (
          <Badge className="ml-2 bg-red-600 text-white text-xs shadow-md">
            {stats.pendingDepositsCount}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="withdrawals">
        Rút tiền
        {stats.pendingWithdrawalsCount > 0 && (
          <Badge className="ml-2 bg-red-600 text-white text-xs shadow-md">
            {stats.pendingWithdrawalsCount}
          </Badge>
        )}
      </TabsTrigger>
      <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

          <TabsContent value="overview">
            <Overview 
              stats={stats}
              users={users}
              purchases={purchases}
              notifications={notifications}
            />
          </TabsContent>

          <TabsContent value="products">
            <Product
              products={products}
              setProducts={setProducts}
              adminUser={adminUser}
            />
          </TabsContent>

          <TabsContent value="users">
            <User
              users={users}
              updateUserStatus={updateUserStatus}
              updateUserBalance={updateUserBalance}
            />
          </TabsContent>

          <TabsContent value="deposits">
            <Deposit
              pendingDeposits={pendingDeposits}
              processingDeposit={processingDeposit}
              approveDeposit={approveDeposit}
              rejectDeposit={rejectDeposit}
              loadData={loadData}
            />
          </TabsContent>

          <TabsContent value="withdrawals">
            <Withdrawmoney
              pendingWithdrawals={pendingWithdrawals}
              processingWithdrawal={processingWithdrawal}
              approveWithdrawal={approveWithdrawal}
              rejectWithdrawal={rejectWithdrawal}
              loadData={loadData}
            />
          </TabsContent>
          <TabsContent value="analytics">
            <Analytics 
              purchases={purchases}
              users={users}
              products={products}
              deposits={pendingDeposits}
              withdrawals={pendingWithdrawals}
            />
          </TabsContent>
          <TabsContent value="support">
            <CustomerSupport 
              users={users}
              adminUser={adminUser}
            />
          </TabsContent>

          <TabsContent value="settings">
            <Setting
              adminUser={adminUser}
              stats={stats}
              testTelegramNotification={testTelegramNotification}
              testWhatsAppNotification={testWhatsAppNotification}
            />
          </TabsContent>
          <TabsContent value="customersupport">
            <CustomerSupport 
              users={users}
              adminUser={adminUser}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
