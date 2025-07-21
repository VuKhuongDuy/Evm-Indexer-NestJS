# Order Module

The Order module provides APIs to retrieve order information from the blockchain indexer with pagination and sorting capabilities.

## APIs

### 1. Get Orders by Token Address

**Endpoint:** `GET /api/v1/orders/by-token`

**Description:** Retrieves all orders that involve a specific token (either as token to sell or token to pay).

**Query Parameters:**
- `tokenAddress` (required): The token address to filter by
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 10, max: 100)
- `sortBy` (optional): Sort order for price - 'asc' or 'desc' (default: 'asc')

**Example Request:**
```bash
GET /api/v1/orders/by-token?tokenAddress=0x1234567890123456789012345678901234567890&page=1&limit=10&sortBy=asc
```

**Example Response:**
```json
{
  "orders": [
    {
      "orderId": "1",
      "seller": "0x1234567890123456789012345678901234567890",
      "tokenToSell": "0x1234567890123456789012345678901234567890",
      "tokenToPay": "0x0987654321098765432109876543210987654321",
      "amountToSell": "1000000000000000000000",
      "amountRemaining": "500000000000000000000",
      "pricePerToken": "1000000000000000000",
      "minOrderSize": "100000000000000000",
      "isActive": true,
      "createdAtBlockNumber": 12345
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

### 2. Get Orders by Seller Address

**Endpoint:** `GET /api/v1/orders/by-seller`

**Description:** Retrieves all orders created by a specific seller address.

**Query Parameters:**
- `sellerAddress` (required): The seller address to filter by
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 10, max: 100)
- `sortBy` (optional): Sort order for price - 'asc' or 'desc' (default: 'asc')

**Example Request:**
```bash
GET /api/v1/orders/by-seller?sellerAddress=0x1234567890123456789012345678901234567890&page=1&limit=10&sortBy=desc
```

**Example Response:**
```json
{
  "orders": [
    {
      "orderId": "2",
      "seller": "0x1234567890123456789012345678901234567890",
      "tokenToSell": "0x0987654321098765432109876543210987654321",
      "tokenToPay": "0x1234567890123456789012345678901234567890",
      "amountToSell": "500000000000000000000",
      "amountRemaining": "500000000000000000000",
      "pricePerToken": "2000000000000000000",
      "minOrderSize": "50000000000000000",
      "isActive": true,
      "createdAtBlockNumber": 12346
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

## Features

### Pagination
- **Page-based pagination** with configurable page size
- **Metadata included** in response (total, current page, total pages, navigation flags)
- **Default values**: page=1, limit=10
- **Maximum limit**: 100 items per page

### Sorting
- **Price-based sorting** by `pricePerToken` field
- **Sort options**: 'asc' (ascending) or 'desc' (descending)
- **Default sort**: ascending order

### Filtering
- **Active orders only**: Only returns orders where `isActive: true`
- **Token filtering**: Searches both `tokenToSell` and `tokenToPay` fields
- **Seller filtering**: Exact match on seller address

### Response Format
All responses follow a consistent paginated format with:
- `orders`: Array of order objects
- `total`: Total number of matching orders
- `page`: Current page number
- `limit`: Number of items per page
- `totalPages`: Total number of pages
- `hasNext`: Boolean indicating if there's a next page
- `hasPrev`: Boolean indicating if there's a previous page

## Error Handling

The APIs return standard HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `500`: Internal server error

## Swagger Documentation

Interactive API documentation is available at `/api` when the application is running.

## Testing

Run the order module tests:
```bash
npm run test src/order/order.service.spec.ts
``` 