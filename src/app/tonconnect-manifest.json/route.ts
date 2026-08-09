import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  const manifest = {
    url: baseUrl,
    name: "Capital Tycoon",
    iconUrl: `${baseUrl}/favicon.ico`,
    termsOfServiceUrl: `${baseUrl}/terms`,
    privacyPolicyUrl: `${baseUrl}/privacy`,
  };
  return NextResponse.json(manifest);
}

