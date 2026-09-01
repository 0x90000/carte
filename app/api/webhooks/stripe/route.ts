// Backward-compatible path for clients using the original Week 8 review URL.
// The canonical implementation keeps raw-body signature verification in the
// payment webhook route and is re-exported here without changing its behavior.
export { POST } from "@/app/api/payment/webhook/route";
