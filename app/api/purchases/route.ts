import { NextRequest, NextResponse } from "next/server";
import { getPurchases, createPurchase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const purchases = await getPurchases(userId ? parseInt(userId) : undefined);
    
    return NextResponse.json({ 
      data: purchases, 
      error: null 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      data: [], 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const purchase = await request.json();
    
    const result = await createPurchase({
      userId: purchase.userId,
      productId: purchase.productId,
      amount: purchase.amount
    });
    
    return NextResponse.json({ 
      success: true,
      purchaseId: result.id
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}