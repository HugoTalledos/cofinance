# Índices de Firestore Recomendados

Este archivo documenta los índices compuestos necesarios para optimizar las consultas de la aplicación.

## Colección: `transactions`

### Índices Compuestos Requeridos

Dado el alto volumen de escritura y las consultas frecuentes por mes y categoría, se recomiendan los siguientes índices:

#### 1. Consultas por usuario y mes (más común)
```
Collection: transactions
Fields indexed:
- userId (Ascending)
- month (Ascending)  
- date (Descending)
```

**Uso**: Obtener todas las transacciones de un usuario en un mes específico, ordenadas por fecha.

#### 2. Consultas por usuario, mes y categoría
```
Collection: transactions
Fields indexed:
- userId (Ascending)
- month (Ascending)
- categoryId (Ascending)
- date (Descending)
```

**Uso**: Filtrar transacciones por categoría dentro de un mes.

#### 3. Consultas por usuario y categoría (histórico)
```
Collection: transactions
Fields indexed:
- userId (Ascending)
- categoryId (Ascending)
- date (Descending)
```

**Uso**: Ver el histórico completo de una categoría.

#### 4. Consultas recientes por usuario
```
Collection: transactions
Fields indexed:
- userId (Ascending)
- createdAt (Descending)
```

**Uso**: Mostrar las transacciones más recientes.

## Colección: `categories`

### Índice Simple
```
Collection: categories
Fields indexed:
- userId (Ascending)
- name (Ascending)
```

**Uso**: Listar categorías de un usuario ordenadas alfabéticamente.

## Colección: `monthly_summary`

### Índices Compuestos

#### 1. Consultas por usuario y rango de meses
```
Collection: monthly_summary
Fields indexed:
- userId (Ascending)
- month (Descending)
```

**Uso**: Obtener resúmenes mensuales ordenados cronológicamente.

## Reglas de Seguridad de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper para verificar que el usuario es dueño del documento
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Categorías
    match /categories/{categoryId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Transacciones
    match /transactions/{transactionId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
                    && isOwner(request.resource.data.userId)
                    && request.resource.data.month is string
                    && request.resource.data.date is string
                    && request.resource.data.amount is number;
      allow update: if isAuthenticated() && isOwner(resource.data.userId);
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
    
    // Resúmenes mensuales
    match /monthly_summary/{summaryId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow write: if isAuthenticated() && isOwner(request.resource.data.userId);
    }
  }
}
```

## Comandos para crear índices

### Via Firebase Console
1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a Firestore Database > Indexes
4. Crea los índices compuestos listados arriba

### Via Firebase CLI
Crea un archivo `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "month", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "month", "order": "ASCENDING" },
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "categories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "monthly_summary",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "month", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Luego ejecuta:
```bash
firebase deploy --only firestore:indexes
```

## Optimizaciones para Alto Volumen de Escritura

### 1. Batch Writes
Para múltiples transacciones, usar batch writes:

```typescript
const batch = writeBatch(db)
transactions.forEach(transaction => {
  const ref = doc(collection(db, 'transactions'))
  batch.set(ref, transaction)
})
await batch.commit()
```

### 2. Actualización de Resúmenes Mensuales
Usar transacciones de Firestore para actualizar `monthly_summary` atómicamente cuando se crea/actualiza una transacción:

```typescript
await runTransaction(db, async (transaction) => {
  const summaryRef = doc(db, 'monthly_summary', summaryId)
  const summaryDoc = await transaction.get(summaryRef)
  
  // Actualizar spent de la categoría
  // Actualizar totalSpent
  
  transaction.update(summaryRef, updatedData)
})
```

### 3. Cloud Functions (Recomendado)
Considera usar Cloud Functions para actualizar `monthly_summary` automáticamente:

```typescript
// functions/src/index.ts
export const onTransactionCreate = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    const transaction = snap.data()
    const summaryId = `${transaction.userId}_${transaction.month}`
    
    // Actualizar resumen mensual
  })
```

## Notas Importantes

- Los índices compuestos pueden tardar varios minutos en crearse
- Firestore creará automáticamente índices simples para campos individuales
- Monitorea el uso de índices en la consola de Firebase
- Para queries complejas, Firestore sugerirá automáticamente crear índices necesarios
