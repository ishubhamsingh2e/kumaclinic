import { NextResponse } from "next/server";
import { ResetPasswordSchema } from "@/lib/schemas/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = ResetPasswordSchema.parse(body);
    // TODO: Implement reset password logic here
    console.log(validatedData);
    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
