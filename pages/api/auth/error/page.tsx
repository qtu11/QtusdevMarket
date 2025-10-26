import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  // Xử lý các loại lỗi cụ thể
  const errorMessages: { [key: string]: string } = {
    OAuthCallback: "Có lỗi xảy ra trong quá trình xác thực với nhà cung cấp. Vui lòng thử lại.",
    AccessDenied: "Truy cập bị từ chối. Bạn không có quyền truy cập vào tài nguyên này.",
    Configuration: "Có lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên.",
    default: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default;

  // Tự động chuyển hướng về trang chủ sau 5 giây (tùy chọn)
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Oops! Có lỗi xảy ra</h1>
        <p className="text-gray-700 mb-6">{errorMessage}</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Quay lại Trang chủ
          </button>
          <button
            onClick={() => router.push("/auth/signin")}
            className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300"
          >
            Thử đăng nhập lại
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-4">
          Bạn sẽ được chuyển hướng về trang chủ sau 5 giây...
        </p>
      </div>
    </div>
  );
}