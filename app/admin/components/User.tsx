"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users } from 'lucide-react';

interface UserProps {
  users: any[];
  updateUserStatus: (userId: string, newStatus: string) => void;
  updateUserBalance: (userId: string, newBalance: number) => void;
}

export function User({ users, updateUserStatus, updateUserBalance }: UserProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-md bg-white/60 dark:bg-gray-800/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              Danh sách người dùng ({users.length})
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
              .map((user: any) => {
                const registrationDate = new Date(user.createdAt);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - registrationDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isNewUser = diffDays <= 7;
                const isOnline = user.lastActivity && (new Date().getTime() - new Date(user.lastActivity).getTime()) < 5 * 60 * 1000; // 5 minutes

                return (
                  <div key={user.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative shadow-md">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full relative">
                        <Users className="w-6 h-6 text-blue-600" />
                        {/* Online status indicator */}
                        {isOnline && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                        {isNewUser && !isOnline && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{user.name || user.email}</h3>
                          {isOnline && (
                            <Badge className="bg-green-600 text-white animate-pulse shadow-md">Online</Badge>
                          )}
                          {isNewUser && !isOnline && (
                            <Badge className="bg-blue-600 text-white shadow-md">Mới</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={user.status === "active" ? "bg-green-500 text-white shadow-md" : "bg-red-500 text-white shadow-md"}>
                            {user.status === "active" ? "Hoạt động" : "Tạm khóa"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className={user.status === "active" ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                            onClick={() => updateUserStatus(user.uid, user.status === "active" ? "locked" : "active")}
                          >
                            {user.status === "active" ? "Khóa" : "Mở"}
                          </Button>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Tham gia: {registrationDate.toLocaleDateString('vi-VN') || "Không có dữ liệu"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Địa chỉ IP: {user.ipAddress || "Không có dữ liệu"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Hoạt động gần nhất: {user.lastActivity ? new Date(user.lastActivity).toLocaleString('vi-VN') : "Không có dữ liệu"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Nhà cung cấp: {user.provider || "Không có dữ liệu"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div>
                        <Label htmlFor={`balance-${user.uid}`} className="text-sm">Số dư</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id={`balance-${user.uid}`}
                            type="number"
                            defaultValue={user.balance || 0}
                            className="w-32"
                            onBlur={(e) => {
                              const newBalance = parseInt((e.target as HTMLInputElement).value) || 0;
                              if (newBalance !== (user.balance || 0)) {
                                updateUserBalance(user.uid, newBalance);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newBalance = parseInt((e.currentTarget as HTMLInputElement).value) || 0;
                                if (newBalance !== (user.balance || 0)) {
                                  updateUserBalance(user.uid, newBalance);
                                }
                              }
                            }}
                          />
                          <span className="text-sm text-green-600">VNĐ</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Đã chi: {(user.totalSpent || 0).toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Đăng nhập: {user.loginCount || 1} lần
                      </p>
                    </div>
                  </div>
                );
              })}
            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Chưa có người dùng nào đăng ký
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
