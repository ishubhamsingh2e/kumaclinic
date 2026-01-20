import { NextResponse } from "next/server";
import { ForgotPasswordSchema } from "@/lib/schemas/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = ForgotPasswordSchema.parse(body);
    // TODO: Implement forgot password logic here
    console.log(validatedData);
    return NextResponse.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
