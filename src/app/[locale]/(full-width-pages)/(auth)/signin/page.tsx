import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "QRHub SignIn Page | QRHub Generate Unlimited QR Codes",
  description: "This is the sign-in page for QRHub, your go-to platform for generating unlimited QR codes with ease and efficiency.",
};

export default function SignIn() {
  return <SignInForm />;
}
