# POST /api/buyer/complaints — Create complaint (multipart)

Request structure for the backend when the buyer adds a complaint.

---

## Request

- **Method:** `POST`
- **URL:** `{BASE_URL}/api/buyer/complaints`
- **Headers:**
  - `Authorization: Bearer <token>` (required)
  - **Do not set** `Content-Type` — the client sends `multipart/form-data` with boundary.

---

## Body (multipart/form-data)

| Part name            | Type   | Required | Description                                      |
|----------------------|--------|----------|--------------------------------------------------|
| `order_id`           | string | Yes      | Order ID the complaint is for                    |
| `reason`             | string | Yes      | User's complaint reason (text)                    |
| `status`             | string | Yes      | Always `"in_review"`                             |
| `comments`           | string | Yes      | Empty string `""`                                |
| `image_verification` | string | Yes      | Always `"pending"` — images not yet verified     |
| `images`             | file   | Yes (×5) | Exactly 5 image files (JPEG), same name `images` |

- **image_verification:** The app sends `"pending"` when creating the complaint. Backend should store this (e.g. column `image_verification_status`) and can later update to `"verified"` after admin/automated verification.
- **images:** The field `images` is sent **5 times** (one per image). Backend should accept as an array of 5 files. Each file: `name` like `image_1.jpg` … `image_5.jpg`, `type`: `image/jpeg`.

---

## Example (conceptual)

```
POST /api/buyer/complaints HTTP/1.1
Host: your-api.com
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----FormBoundary...

------FormBoundary...
Content-Disposition: form-data; name="order_id"

cdd4e440-d042-4f6a-bd4f-ea8589c08177
------FormBoundary...
Content-Disposition: form-data; name="reason"

Fruits were damaged on delivery
------FormBoundary...
Content-Disposition: form-data; name="status"

in_review
------FormBoundary...
Content-Disposition: form-data; name="comments"


------FormBoundary...
Content-Disposition: form-data; name="image_verification"

pending
------FormBoundary...
Content-Disposition: form-data; name="images"; filename="image_1.jpg"
Content-Type: image/jpeg

<binary>
------FormBoundary...
Content-Disposition: form-data; name="images"; filename="image_2.jpg"
Content-Type: image/jpeg

<binary>
... (images 3, 4, 5)
------FormBoundary...--
```

---

## Backend handling

- Parse multipart; read `order_id`, `reason`, `status`, `comments`, **`image_verification`** as form fields.
- Store **image_verification** (e.g. `image_verification_status` = `"pending"`). Later an admin flow or job can set it to `"verified"`.
- Read `images` as an array of 5 files; store or process as needed.

---

## Success / existing complaint

- **2xx:** Complaint created; response body optional.
- **409 + body with `code: "COMPLAINT_EXISTS"` and `complaint: { id, ... }`:** App shows “existing complaint” and “View complaint” to open that complaint.
