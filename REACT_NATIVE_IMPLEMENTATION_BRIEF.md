# FreshRoute Buyer Order Tracking - React Native Implementation Brief

## Project Overview
You are tasked with implementing the buyer order tracking flow for FreshRoute, a fruit supply chain management app. The backend APIs are complete and functional. Your focus is on creating a professional, production-ready React Native mobile application.

## Tech Stack Requirements
- **Framework:** React Native with Expo
- **Language:** TypeScript (strictly typed)
- **State Management:** React Query v4+ (mandatory for server state)
- **UI Library:** React Native Paper or NativeBase (your choice)
- **Navigation:** React Navigation v6
- **Forms:** React Hook Form + Yup validation
- **HTTP Client:** Axios with interceptors
- **Maps:** react-native-maps
- **Image Handling:** expo-image-picker, expo-file-system

## Backend Architecture Context

### Database Schema
```typescript
interface PlacedOrder {
  id: string; // UUID
  buyer_id: string;
  fruit_type: string;
  variant: string;
  grade: 'A' | 'B' | 'C';
  quantity: number;
  required_date: string;
  delivery_location: string;
  latitude?: number;
  longitude?: number;
  status: 'OPEN' | 'PENDING_BUYER' | 'PENDING_FARMER' | 'AWAITING_PAYMENT' | 
          'AUTHORIZED_PAYMENT' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED';
  payment_status: 'UNPAID' | 'AUTHORIZED' | 'RELEASED';
  total_amount: number;
  selected_farmer_id?: string;
  harvest_id?: string;
  transporter_id?: string;
  quality_confirmed_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  order_id: string;
  buyer_id: string;
  amount: number;
  currency: 'LKR';
  status: 'PENDING' | 'AUTHORIZED' | 'RELEASED';
  payment_method: 'bank_slip';
  payment_slip_url?: string;
  slip_uploaded_at?: string;
  slip_ocr_data?: {
    amount: number;
    date: string;
    reference: string;
    bank: string;
    confidence: number;
  };
  slip_verification_status: 'PENDING' | 'AUTO_APPROVED' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
  slip_verified_by?: string;
  slip_verified_at?: string;
  slip_verification_notes?: string;
  authorized_at?: string;
  released_at?: string;
}
```

### API Endpoints Available

```typescript
// Orders
GET    /api/buyer/place-order              // List all orders
GET    /api/buyer/place-order/:orderId     // Order details

// Payment Slip Upload
POST   /api/buyer/payment-slip/upload      // Upload payment slip (multipart/form-data)
GET    /api/buyer/payment-slip/status/:orderId

// Payment Status
GET    /api/buyer/payment/status/:orderId

// All endpoints require: Authorization: Bearer {token}
```

### Payment Slip Upload Response
```typescript
{
  message: string;
  verificationStatus: 'AUTO_APPROVED' | 'PENDING' | 'FLAGGED';
  ocrData: {
    amount: number;
    date: string;
    reference: string;
    bank: string;
    confidence: number;
  };
  fraudScore?: {
    score: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    flags: string[];
  };
}
```

## Current Implementation Status

### ✅ Already Completed
- Orders List Screen showing all orders
- Order filtering/tabs up to AWAITING_PAYMENT status
- Basic navigation structure
- Authentication flow

### 🎯 Your Implementation Tasks

#### Task 1: Enhance Order Detail Screen
**Location:** `screens/orders/OrderDetailScreen.tsx`

**Requirements:**
1. **Progress Timeline Component**
   - 8-step visual timeline (Order Placed → Completed)
   - Dynamic state based on order.status
   - Show completion dates for each step
   - Highlight current step with animation

2. **Information Cards** (Create reusable InfoCard component)
   - Order Details (product, quantity, amount, delivery info)
   - Farmer Information (name, contact, rating) - conditional rendering
   - Payment Information (amount, status, slip details, OCR data)
   - Delivery Information (driver details, vehicle) - conditional rendering

3. **Context-Aware Action Buttons**
   - AWAITING_PAYMENT: "Upload Payment Slip" (primary CTA)
   - AUTHORIZED_PAYMENT: "Contact Farmer", "View Payment"
   - IN_TRANSIT: "Track Delivery", "Contact Driver"
   - DELIVERED: "Confirm Receipt", "Report Issue"
   - COMPLETED: "Reorder", "Leave Review"

4. **Real-time Updates**
   - Poll order details every 30 seconds
   - Use React Query's refetchInterval
   - Pull-to-refresh implementation

**Design Notes:**
- Use Card components for information grouping
- Status badges with color coding (refer to design system below)
- Bottom sheet or modal for contact actions
- Skeleton loaders during data fetch

---

#### Task 2: Payment Slip Upload Screen
**Location:** `screens/payments/PaymentSlipUploadScreen.tsx`

**Requirements:**

1. **Image Capture**
   - Camera integration (expo-image-picker)
   - Gallery selection
   - Permission handling with user-friendly messages
   - Image preview before upload
   - Image quality: 0.8, max dimension: 1920px

2. **Upload Instructions Card**
   ```
   📸 Upload Instructions
   ✓ Ensure good lighting
   ✓ Capture full payment slip
   ✓ Amount and date clearly visible
   ✓ Formats: JPG, PNG (Max 5MB)
   ```

3. **Order Summary Display**
   - Order ID (first 8 chars)
   - Amount to Pay (large, bold, LKR format)
   - Due date if applicable

4. **Upload Flow**
   - FormData construction with proper MIME types
   - Progress indicator during upload
   - OCR result display after upload
   - Auto-navigation to Payment Status on success

5. **Error Handling**
   - File size validation (5MB)
   - Network errors with retry option
   - Invalid file type alerts
   - Upload failure recovery

**Implementation Pattern:**
```typescript
const uploadPaymentSlip = useMutation(
  async (formData: FormData) => {
    return api.post('/api/buyer/payment-slip/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => setProgress(e.loaded / e.total),
    });
  },
  {
    onSuccess: (data) => {
      // Show success modal with verification status
      // Navigate to Payment Status screen
    },
  }
);
```

---

#### Task 3: Payment Status Screen
**Location:** `screens/payments/PaymentStatusScreen.tsx`

**Requirements:**

1. **Status Display System**
   Create dynamic status cards for 5 verification states:

   **PENDING:**
   - Icon: ⏳
   - Color: Orange
   - Message: "Payment under review"
   - Estimated time: "2-4 hours"

   **AUTO_APPROVED:**
   - Icon: ✅
   - Color: Green
   - Message: "Payment automatically verified"
   - Sub-message: "Order confirmed. Waiting for driver assignment."

   **FLAGGED:**
   - Icon: ⚠️
   - Color: Orange
   - Message: "Requires manual review"
   - Estimated time: "Within 24 hours"

   **APPROVED:**
   - Icon: ✅
   - Color: Green
   - Message: "Payment verified by admin"

   **REJECTED:**
   - Icon: ❌
   - Color: Red
   - Message: Display admin notes
   - Action: "Upload New Slip" button

2. **Auto-Refresh**
   - Poll every 10 seconds using React Query
   - Visual indicator when fetching updates
   - Pull-to-refresh manual trigger

3. **Payment Details Section**
   - Upload date/time
   - Verification date/time (if verified)
   - OCR extracted data (amount, date, reference, bank, confidence %)
   - Payment slip image viewer (lightbox/modal)

4. **Navigation Actions**
   - "View Uploaded Slip" (image viewer)
   - "Back to Order Details"
   - "Contact Support" (open support chat/email)

---

#### Task 4: Order Tracking Screen (Live Delivery)
**Location:** `screens/orders/OrderTrackingScreen.tsx`

**Requirements:**

1. **Map Integration**
   - react-native-maps implementation
   - Three markers:
     * Pickup location (Farmer) - Green pin
     * Delivery location (Buyer) - Red pin
     * Driver location (if available) - Custom truck icon
   - Route polyline between locations
   - Auto-adjust map region to fit all markers

2. **Driver Information Bottom Sheet**
   - Driver photo (circular avatar)
   - Driver name and phone
   - Vehicle number and type
   - ETA display (if available)
   - "Call Driver" and "Get Directions" buttons

3. **Status Timeline** (3 steps)
   - ✅ Picked up from farmer (timestamp)
   - 🚚 In transit to your location (current, animated)
   - 📦 Delivered (pending)

4. **Real-time Updates**
   - Poll driver location every 5 seconds
   - Update ETA dynamically
   - WebSocket integration (if available, otherwise polling)

5. **External Integrations**
   - Phone call: `Linking.openURL('tel:{phone}')`
   - Directions: `Linking.openURL('https://maps.google.com/?q={lat},{lng}')`

---

## Reusable Components to Create

### 1. StatusBadge Component
**Location:** `components/ui/StatusBadge.tsx`

```typescript
interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

// Color mapping
const statusColors = {
  AWAITING_PAYMENT: { bg: '#FFF3E0', color: '#F57C00', icon: '💰' },
  AUTHORIZED_PAYMENT: { bg: '#E3F2FD', color: '#1976D2', icon: '📦' },
  IN_TRANSIT: { bg: '#E8F5E9', color: '#388E3C', icon: '🚚' },
  // ... complete all statuses
};
```

**Features:**
- Pill-shaped badge with icon + text
- Size variants with proper scaling
- Accessibility labels
- Press animation (optional)

---

### 2. ProgressTimeline Component
**Location:** `components/ui/ProgressTimeline.tsx`

```typescript
interface TimelineStep {
  label: string;
  completed: boolean;
  isCurrent?: boolean;
  date?: string;
  icon?: string;
}

interface ProgressTimelineProps {
  steps: TimelineStep[];
  orientation?: 'vertical' | 'horizontal';
}
```

**Design:**
- Vertical layout preferred for mobile
- Dots connected by lines
- Completed steps: filled green circle
- Current step: pulsing animation
- Future steps: gray outline circle
- Timestamps on the right

---

### 3. InfoCard Component
**Location:** `components/ui/InfoCard.tsx`

```typescript
interface InfoCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  actions?: ReactNode;
}
```

**Features:**
- Card with header (title + icon)
- Collapsible content (Accordion)
- Action buttons at bottom
- Shadow/elevation styling
- Margin/padding consistency

---

### 4. DetailRow Component
**Location:** `components/ui/DetailRow.tsx`

```typescript
interface DetailRowProps {
  label: string;
  value: string | ReactNode;
  bold?: boolean;
  large?: boolean;
  badge?: boolean;
  icon?: string;
  onPress?: () => void;
}
```

**Layout:**
- Two-column layout (label left, value right)
- Optional action icon/button
- Pressable row for actions
- Divider between rows

---

### 5. EmptyState Component
**Location:** `components/ui/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}
```

---

## Design System

### Color Palette
```typescript
export const colors = {
  primary: '#4CAF50',      // Green
  secondary: '#2196F3',    // Blue
  error: '#F44336',        // Red
  warning: '#FF9800',      // Orange
  success: '#4CAF50',      // Green
  info: '#2196F3',         // Blue
  
  // Status Colors
  pending: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
  inTransit: '#2196F3',
  
  // Neutrals
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray500: '#9E9E9E',
  gray700: '#616161',
  gray900: '#212121',
  
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F5F5F5',
  
  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
};
```

### Typography
```typescript
export const typography = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h4: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
};
```

### Spacing System
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### Border Radius
```typescript
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
};
```

---

## React Query Setup

### API Client
```typescript
// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://YOUR_BACKEND_URL:4000',
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Query Hooks
```typescript
// hooks/useOrders.ts
export const useOrders = () => {
  return useQuery(['orders'], async () => {
    const { data } = await api.get('/api/buyer/place-order');
    return data.orders;
  });
};

// hooks/useOrderDetails.ts
export const useOrderDetails = (orderId: string) => {
  return useQuery(
    ['order', orderId],
    async () => {
      const { data } = await api.get(`/api/buyer/place-order/${orderId}`);
      return data.order;
    },
    {
      refetchInterval: 30000, // Poll every 30 seconds
      enabled: !!orderId,
    }
  );
};

// hooks/usePaymentStatus.ts
export const usePaymentStatus = (orderId: string) => {
  return useQuery(
    ['payment-status', orderId],
    async () => {
      const { data } = await api.get(`/api/buyer/payment/status/${orderId}`);
      return data;
    },
    {
      refetchInterval: 10000, // Poll every 10 seconds
      enabled: !!orderId,
    }
  );
};

// hooks/useUploadPaymentSlip.ts
export const useUploadPaymentSlip = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (formData: FormData) => {
      const { data } = await api.post('/api/buyer/payment-slip/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    {
      onSuccess: (data, variables) => {
        const orderId = variables.get('orderId');
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['order', orderId]);
        queryClient.invalidateQueries(['payment-status', orderId]);
      },
    }
  );
};
```

---

## Navigation Structure

```typescript
// navigation/OrderStackNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type OrderStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
  UploadPayment: { orderId: string };
  PaymentStatus: { orderId: string };
  TrackDelivery: { orderId: string };
};

const Stack = createNativeStackNavigator<OrderStackParamList>();

export function OrderStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name="OrdersList" 
        component={OrdersListScreen}
        options={{ title: 'My Orders' }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen 
        name="UploadPayment" 
        component={PaymentSlipUploadScreen}
        options={{ title: 'Upload Payment Slip' }}
      />
      <Stack.Screen 
        name="PaymentStatus" 
        component={PaymentStatusScreen}
        options={{ title: 'Payment Status' }}
      />
      <Stack.Screen 
        name="TrackDelivery" 
        component={OrderTrackingScreen}
        options={{ title: 'Track Delivery' }}
      />
    </Stack.Navigator>
  );
}
```

---

## Error Handling Strategy

```typescript
// utils/errorHandler.ts
export const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || 'Server error occurred';
  } else if (error.request) {
    return 'Network error. Check your connection.';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};

// Usage in components
const { error, isError } = useOrderDetails(orderId);

if (isError) {
  return (
    <ErrorState 
      message={handleApiError(error)}
      onRetry={() => refetch()}
    />
  );
}
```

---

## Utility Functions

```typescript
// utils/formatters.ts
export const formatCurrency = (amount: number): string => {
  return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// utils/phone.ts
import { Linking, Alert, Platform } from 'react-native';

export const callPhone = async (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;
  const supported = await Linking.canOpenURL(url);
  
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Error', 'Phone calls are not supported on this device');
  }
};

export const sendSMS = async (phoneNumber: string, message?: string) => {
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${phoneNumber}${message ? `${separator}body=${message}` : ''}`;
  
  await Linking.openURL(url);
};

// utils/maps.ts
export const openDirections = async (latitude: number, longitude: number) => {
  const url = Platform.select({
    ios: `maps:0,0?q=${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}`,
  });
  
  if (url) {
    await Linking.openURL(url);
  }
};
```

---

## Testing Requirements

### Unit Tests
- All utility functions (formatters, validators)
- Custom hooks (useOrders, usePaymentStatus)
- Pure components (StatusBadge, DetailRow)

### Integration Tests
- Payment slip upload flow
- Order status transitions
- Navigation between screens

### E2E Tests (Detox/Maestro)
- Complete order tracking journey
- Payment slip upload and verification
- Error handling scenarios

---

## Performance Optimization

1. **Image Optimization**
   - Compress images before upload (expo-image-manipulator)
   - Lazy load images in lists
   - Use progressive JPEGs

2. **List Performance**
   - FlatList with proper keyExtractor
   - getItemLayout for fixed-height items
   - windowSize optimization

3. **Query Optimization**
   - Stale time configuration
   - Cache time management
   - Selective invalidation

4. **Code Splitting**
   - Lazy load heavy screens
   - Dynamic imports for maps

5. **Memoization**
   - React.memo for expensive components
   - useMemo for derived state
   - useCallback for handlers

---

## Accessibility Requirements

1. **Screen Readers**
   - Meaningful accessibilityLabel on all interactive elements
   - accessibilityHint for complex interactions
   - accessibilityRole for semantic meaning

2. **Touch Targets**
   - Minimum 44x44pt touch target size
   - Adequate spacing between interactive elements

3. **Color Contrast**
   - WCAG AA compliance (4.5:1 for text)
   - Don't rely solely on color for status

4. **Dynamic Type**
   - Support system font scaling
   - Test with large text sizes

---

## Deliverables Checklist

- [ ] Order Detail Screen with all sections
- [ ] Progress Timeline Component (reusable)
- [ ] Payment Slip Upload Screen (camera + gallery)
- [ ] Payment Status Screen with auto-refresh
- [ ] Order Tracking Screen with live map
- [ ] StatusBadge component (fully typed)
- [ ] InfoCard component (collapsible)
- [ ] DetailRow component
- [ ] All React Query hooks with proper typing
- [ ] Error handling utilities
- [ ] Formatter utilities (date, currency)
- [ ] Phone/Maps integration utilities
- [ ] TypeScript interfaces for all data models
- [ ] Navigation typing (ParamList)
- [ ] Unit tests for utilities (>80% coverage)
- [ ] Integration tests for critical flows
- [ ] Accessibility labels on all screens
- [ ] Performance profiling results
- [ ] Code documentation (JSDoc)
- [ ] README with setup instructions

---

## Quality Standards

1. **Code Quality**
   - ESLint/Prettier configured and passing
   - TypeScript strict mode enabled
   - No `any` types (use `unknown` if necessary)
   - Proper error boundaries

2. **Documentation**
   - JSDoc for all public functions/components
   - README with architecture decisions
   - Inline comments for complex logic

3. **Git Hygiene**
   - Atomic commits with conventional commit messages
   - Feature branches
   - PR template compliance

4. **Performance**
   - 60 FPS on mid-tier devices
   - < 3s initial screen load
   - No memory leaks

---

## Timeline Estimate

- **Order Detail Screen:** 8 hours
- **Payment Upload Screen:** 6 hours
- **Payment Status Screen:** 4 hours
- **Order Tracking Screen:** 8 hours
- **Reusable Components:** 6 hours
- **Hooks & Utils:** 4 hours
- **Testing:** 8 hours
- **Polish & Bug Fixes:** 4 hours

**Total:** ~48 hours (6 working days)

---

## Questions to Clarify

1. Is push notification implementation required for status updates?
2. Should we support offline mode with local caching?
3. Are there analytics tracking requirements?
4. What's the minimum supported iOS/Android version?
5. Is WebSocket available for real-time tracking, or should we use polling?
6. Do we need dark mode support?
7. Are there any specific accessibility certifications required?

---

## Success Criteria

✅ All screens render correctly on iOS and Android  
✅ Payment slip upload works with both camera and gallery  
✅ Real-time status updates function properly  
✅ Map tracking displays driver location accurately  
✅ No crashes or ANRs during normal usage  
✅ Accessibility score >90 on both platforms  
✅ Code review approval from senior team  
✅ QA testing completed with <5 minor bugs  

---

**Questions? Contact the backend team for API clarifications or database schema details.**
