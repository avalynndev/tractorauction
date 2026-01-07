# Swagger API Documentation Setup

This project uses Swagger/OpenAPI for API documentation. The documentation is available at `/api-docs`.

## Overview

- **Swagger UI**: Interactive API documentation interface
- **OpenAPI 3.0**: Modern API specification standard
- **JSDoc Annotations**: Documentation is written directly in code comments

## Accessing the Documentation

1. **Development**: Navigate to `http://localhost:3000/api-docs`
2. **Production**: Navigate to `https://www.tractorauction.in/api-docs`

## How It Works

1. **Swagger Spec Generation**: The spec is generated from JSDoc comments in API route files
2. **API Endpoint**: `/api/swagger.json` serves the OpenAPI specification
3. **UI Component**: React component renders the Swagger UI

## Adding Documentation to API Routes

To document an API endpoint, add JSDoc comments with `@swagger` annotations:

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     tags:
 *       - Example
 *     summary: Example endpoint
 *     description: This is an example endpoint
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  // Your code here
}
```

## Common Patterns

### Authentication Required
```typescript
security:
  - bearerAuth: []
```

### Request Body
```typescript
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required:
          - field1
        properties:
          field1:
            type: string
          field2:
            type: number
```

### Query Parameters
```typescript
parameters:
  - in: query
    name: limit
    schema:
      type: integer
      default: 50
    description: Maximum number of results
```

### Response Schemas
Reference shared schemas:
```typescript
schema:
  $ref: '#/components/schemas/User'
```

## Available Schemas

The following schemas are pre-defined in `lib/swagger.ts`:
- `Error` - Standard error response
- `User` - User object
- `Vehicle` - Vehicle object
- `Auction` - Auction object
- `Notification` - Notification object

## Testing APIs

The Swagger UI includes a "Try it out" feature that allows you to:
1. Fill in parameters
2. Add authentication tokens
3. Execute requests
4. View responses

## Adding New Schemas

To add a new schema, update `lib/swagger.ts`:

```typescript
components: {
  schemas: {
    YourNewSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    },
  },
}
```

## Best Practices

1. **Document all endpoints**: Every API route should have Swagger documentation
2. **Use tags**: Group related endpoints with tags
3. **Describe parameters**: Include descriptions for all parameters
4. **Define responses**: Document all possible response codes
5. **Use schemas**: Reference shared schemas for consistency
6. **Keep it updated**: Update documentation when APIs change

## Troubleshooting

### Documentation not appearing
- Check that JSDoc comments are properly formatted
- Verify the file path matches the pattern in `lib/swagger.ts` (`./app/api/**/*.ts`)
- Check browser console for errors

### Spec not generating
- Ensure `swagger-jsdoc` is installed
- Check that API files are in the correct location
- Verify JSDoc syntax is correct

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI React](https://github.com/swagger-api/swagger-ui)


