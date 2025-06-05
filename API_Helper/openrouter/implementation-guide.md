# OpenRouter API Implementation Guide

OpenRouter provides a unified interface to access a wide array of Large Language Models (LLMs) from various providers. This simplifies integration by offering a single API endpoint and authentication method, along with features like automatic fallbacks and cost management. For an event discovery platform, OpenRouter can be used for tasks like event description summarization, keyword extraction from event details, classifying events, or processing natural language queries for event search.

---

## 1. Authentication

OpenRouter uses API keys for authentication. Requests must include an `Authorization` header with a Bearer token. Additionally, `HTTP-Referer` and `X-Title` headers are required.

**Steps to get an API Key:**
1.  Create an account on [OpenRouter.ai](https://openrouter.ai/).
2.  Navigate to the "Keys" section in your account settings.
3.  Generate a new API key.

**Required Headers for API Requests:**
```
Authorization: Bearer YOUR_OPENROUTER_API_KEY
HTTP-Referer: YOUR_SITE_URL_OR_APP_NAME 
X-Title: YOUR_APP_NAME 
```
- Replace `YOUR_OPENROUTER_API_KEY` with your actual key.
- `YOUR_SITE_URL_OR_APP_NAME` should be the URL of your application or a recognizable name if it's a backend service (e.g., `https://newevents.com` or `NEWEVENTS-Backend`).
- `YOUR_APP_NAME` can be the same as `X-Title` or a more user-friendly name.

[Source: OpenRouter Authentication Docs][3]

---

## 2. Key API Endpoints & Functionalities

OpenRouter primarily uses an OpenAI-compatible API structure, meaning you can often use OpenAI SDKs with minor configuration changes. The main endpoint for interactions is typically the Chat Completions endpoint.

**Base API URL:** `https://api.openrouter.ai/api/v1`

### Chat Completions
This is the primary endpoint for text generation, summarization, classification, and query processing.

**Endpoint:** `POST /chat/completions`

**Request Body (JSON):**
```json
{
  "model": "google/gemini-flash-1.5", // Specify the model to use (e.g., "mistralai/mistral-7b-instruct", "openai/gpt-3.5-turbo")
  "messages": [
    {"role": "system", "content": "You are an expert event summarizer."},
    {"role": "user", "content": "Summarize this event description: [Full event description text here]"}
  ],
  "temperature": 0.7, // Optional: Controls randomness (0.0 to 2.0)
  "max_tokens": 150,  // Optional: Max number of tokens in the response
  "top_p": 1.0,       // Optional: Nucleus sampling
  // Other parameters like stream, stop, presence_penalty, frequency_penalty can also be used.
}
```

**Example Usage for Event Discovery Platform:**

*   **Event Summarization:**
    *   `system` message: "Summarize the following event description into two concise sentences, highlighting the main activity and location."
    *   `user` message: [Full text of an event description]
*   **Keyword Extraction:**
    *   `system` message: "Extract up to 5 relevant keywords from the following event text. Keywords should be suitable for event search filters. Return as a comma-separated list."
    *   `user` message: [Full text of an event description]
*   **Event Classification:**
    *   `system` message: "Classify the following event into one of these categories: Music, Sports, Arts & Theater, Food & Drink, Workshop, Conference, Community. Return only the category name."
    *   `user` message: [Event title and short description]
*   **Natural Language Search Query Processing:**
    *   `system` message: "Convert the user's natural language query into structured search parameters. Identify keywords, location, and date if mentioned. For example, if the user says 'music concerts in London next weekend', output JSON like {'keywords': 'music concert', 'location': 'London', 'date_range': 'next weekend'}."
    *   `user` message: [User's search query, e.g., "Find tech meetups in San Francisco this month"]

### List Models
To get a list of available models.

**Endpoint:** `GET /models`

This can be useful to dynamically select models or check for new additions.

---

## 3. Data Models (Request/Response for Chat Completions)

OpenRouter follows the OpenAI API structure for chat completions.

**Request:** (As shown in the Chat Completions section above)
- `model` (string, required): The ID of the model to use.
- `messages` (array of objects, required): A list of message objects. Each object has:
    - `role` (string): "system", "user", or "assistant".
    - `content` (string): The message content.
- `temperature`, `max_tokens`, `top_p`, `stream`, etc. (optional parameters).

**Response (Non-Streaming):**
```json
{
  "id": "chatcmpl-xxxxxxxxxxxxxxxxxxxxx",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "google/gemini-flash-1.5", // Model used
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "This is the AI's response to your prompt."
      },
      "finish_reason": "stop" // e.g., "stop", "length", "content_filter"
    }
  ],
  "usage": {
    "prompt_tokens": 56,
    "completion_tokens": 31,
    "total_tokens": 87
  }
}
```
**Response (Streaming):**
If `stream: true` is set, the API returns a series of server-sent events. Each event will have a `data` field containing a JSON object with a `choices` array, where each choice has a `delta` object (e.g., `{"delta": {"content": "some text"}}`). The last event will have `{"delta": {}}` and a `finish_reason`.

[Source: OpenRouter API Reference, OpenAI Compatibility][2][4]

---

## 4. Error Handling

OpenRouter uses standard HTTP status codes.
- `200 OK`: Success.
- `400 Bad Request`: Invalid request (e.g., missing required fields, malformed JSON). The response body usually contains details.
- `401 Unauthorized`: Authentication failed (e.g., invalid API key, missing required headers like `HTTP-Referer` or `X-Title`)[3].
- `402 Payment Required`: Credits exhausted or payment issue.
- `403 Forbidden`: You don't have permission to access the requested model or resource.
- `404 Not Found`: The requested model or endpoint does not exist.
- `429 Too Many Requests`: Rate limit exceeded. Check response headers like `Retry-After`, `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`.
- `500 Internal Server Error`: An error on OpenRouter's side or an issue with an upstream provider. OpenRouter attempts automatic fallbacks[1].
- `503 Service Unavailable`: The service or a specific model is temporarily unavailable.

**Example Error Handling (Python with OpenAI SDK):**
```python
import openai
import os

openai.api_base = "https://api.openrouter.ai/api/v1"
openai.api_key = os.getenv("OPENROUTER_API_KEY")
openai.default_headers = {
    "HTTP-Referer": os.getenv("YOUR_SITE_URL"), # Or your actual site URL
    "X-Title": os.getenv("YOUR_APP_NAME") # Or your actual app name
}

try:
  response = openai.ChatCompletion.create(
    model="google/gemini-flash-1.5",
    messages=[{"role": "user", "content": "Tell me a joke."}]
  )
  print(response.choices[0].message.content)
except openai.error.APIError as e:
  print(f"OpenRouter API returned an API Error: {e}")
except openai.error.AuthenticationError as e:
  print(f"Authentication Error: {e}")
except openai.error.RateLimitError as e:
  print(f"Rate Limit Exceeded: {e}")
except openai.error.InvalidRequestError as e:
  print(f"Invalid Request: {e}")
except Exception as e:
  print(f"An unexpected error occurred: {e}")
```

---

## 5. Rate Limiting

- Default rate limits are often around 60 requests per minute (RPM) per model, but can vary. Check the `x-ratelimit-*` headers in API responses for specific limits for the model you are using[4].
- Some models might have lower free tier limits.
- **Strategies:**
    - Implement exponential backoff with jitter when `429` errors occur.
    - Cache responses for common, non-user-specific prompts if applicable.
    - Monitor usage through your OpenRouter dashboard and response headers.
    - Distribute requests across different models if one is hitting limits (though this might affect consistency).

---

## 6. Best Practices

1.  **Explicit Model Selection**: Always specify the `model` you intend to use. Relying on defaults can lead to unexpected behavior or costs.
2.  **Header Requirements**: Ensure `Authorization`, `HTTP-Referer`, and `X-Title` headers are correctly set in all requests to avoid `401` or `400` errors[3].
3.  **Cost Management**:
    *   Be mindful of token usage (`prompt_tokens` + `completion_tokens`).
    *   Use `max_tokens` to limit response length and cost.
    *   Choose models appropriate for the task's complexity and your budget (e.g., smaller models for simpler tasks). OpenRouter provides pricing per model.
4.  **Parameter Tuning**: Experiment with `temperature` and `top_p` to control creativity vs. factuality, depending on the task (e.g., lower temperature for classification, higher for creative text generation)[5].
5.  **System Prompts**: Use clear and effective system prompts to guide the model's behavior for tasks like summarization or classification.
6.  **Fallback Strategy**: While OpenRouter handles some fallbacks, consider your own application-level logic for retrying with a different model if a preferred model fails or is too slow.
7.  **Security**: Store your OpenRouter API key securely using environment variables or a secrets management system. Do not embed it directly in client-side code.
8.  **Data Privacy**: Be aware of OpenRouter's and the underlying model providers' data usage policies, especially if processing sensitive information[4]. OpenRouter allows setting data policies at the organization level.

---

## 7. Common Pitfalls

-   **Missing Required Headers**: Forgetting `HTTP-Referer` or `X-Title` is a common cause of `400` or `401` errors[3].
-   **Incorrect API Base URL**: Ensure you are using `https://api.openrouter.ai/api/v1` when configuring SDKs.
-   **Ignoring Model-Specific Parameters**: Some models support unique parameters not available in others. Overriding parameters not supported by a provider might be ignored[5].
-   **Unexpected Costs**: Not setting `max_tokens` or using very large models for simple tasks can lead to higher-than-expected costs.
-   **Inconsistent Output**: Different models will produce different results. If consistency is key, stick to a specific model or fine-tune your prompts extensively.
-   **Not Handling Streaming Correctly**: If using `stream: true`, ensure your client code correctly processes the stream of events.

---

## 8. Official Resources

-   **OpenRouter Documentation**: [https://openrouter.ai/docs](https://openrouter.ai/docs)
-   **API Reference**: [https://openrouter.ai/docs/api-reference/overview](https://openrouter.ai/docs/api-reference/overview)[2]
-   **Authentication**: [https://openrouter.ai/docs/api-reference/authentication](https://openrouter.ai/docs/api-reference/authentication)[3]
-   **Parameters**: [https://openrouter.ai/docs/api-reference/parameters](https://openrouter.ai/docs/api-reference/parameters)[5]
-   **Available Models & Pricing**: [https://openrouter.ai/models](https://openrouter.ai/models)[4]
-   **Quickstart Guide**: [https://openrouter.ai/docs/quick-start](https://openrouter.ai/docs/quick-start)[1]

By leveraging OpenRouter's unified API, an event discovery platform can efficiently integrate various AI capabilities for enhancing event data and user search experience.