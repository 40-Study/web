import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy-headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { path: string[] } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}

export async function OPTIONS(request: NextRequest, { params }: RouteContext) {
  return proxyRequest(request, params.path);
}
