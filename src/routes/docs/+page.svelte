<script lang="ts">
	import { Card, A, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell } from 'flowbite-svelte';
</script>

<div class="flex flex-1 items-start justify-center px-4 pt-16">
	<div class="w-full max-w-5xl">
		<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">API Documentation</h1>
		<p class="mb-8 text-gray-600 dark:text-gray-400">Integrate image conversion into your applications with our REST API.</p>

		<!-- Authentication -->
		<Card size="xl" class="mb-6 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Authentication</h2>
			<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
				All API requests require a Bearer token in the <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">Authorization</code> header.
			</p>
			<div class="mb-3 overflow-x-auto rounded bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
				<span class="text-gray-500">Authorization:</span> Bearer ic_your_token_here
			</div>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Generate API tokens in your <A href="/settings">API Settings</A> page. Tokens are shown once at creation — store them securely.
			</p>
		</Card>

		<!-- Endpoints -->
		<Card size="xl" class="mb-6 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Endpoints</h2>

			<!-- GET -->
			<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
				<code class="rounded bg-green-100 px-2 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">GET</code>
				<code class="ml-2 text-sm dark:text-gray-200">/api/v1/convert</code>
			</h3>
			<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">Returns your current usage info, plan details, and supported formats.</p>
			<p class="mb-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Response</p>
			<div class="mb-6 overflow-x-auto rounded bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
				<pre>{`{
  "plan": "api_free",
  "label": "Free",
  "usage": {
    "used": 12,
    "limit": 50,
    "remaining": 38,
    "period": "day"
  },
  "maxFileSize": 10485760,
  "formats": ["png","jpg","webp","gif","bmp","tiff","avif","ico"]
}`}</pre>
			</div>

			<!-- POST -->
			<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
				<code class="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">POST</code>
				<code class="ml-2 text-sm dark:text-gray-200">/api/v1/convert</code>
			</h3>
			<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">Convert an image file. Send as <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">multipart/form-data</code>.</p>

			<Table striped class="mb-3">
				<TableHead>
					<TableHeadCell>Field</TableHeadCell>
					<TableHeadCell>Type</TableHeadCell>
					<TableHeadCell>Required</TableHeadCell>
					<TableHeadCell>Description</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">file</code></TableBodyCell>
						<TableBodyCell>File</TableBodyCell>
						<TableBodyCell>Yes</TableBodyCell>
						<TableBodyCell>The image file to convert</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">format</code></TableBodyCell>
						<TableBodyCell>String</TableBodyCell>
						<TableBodyCell>Yes</TableBodyCell>
						<TableBodyCell>Target format (see supported formats below)</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">quality</code></TableBodyCell>
						<TableBodyCell>Integer</TableBodyCell>
						<TableBodyCell>No</TableBodyCell>
						<TableBodyCell>Quality 1–100 (for formats that support it)</TableBodyCell>
					</TableBodyRow>
				</TableBody>
			</Table>

			<p class="text-sm text-gray-600 dark:text-gray-400">
				On success, returns the converted image binary with appropriate <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">Content-Type</code> and <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">Content-Disposition</code> headers.
			</p>
		</Card>

		<!-- Supported Formats -->
		<Card size="xl" class="mb-6 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Supported Formats</h2>
			<Table striped>
				<TableHead>
					<TableHeadCell>Format</TableHeadCell>
					<TableHeadCell>Value</TableHeadCell>
					<TableHeadCell>MIME Type</TableHeadCell>
					<TableHeadCell>Quality Support</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow>
						<TableBodyCell>PNG</TableBodyCell>
						<TableBodyCell><code class="text-xs">png</code></TableBodyCell>
						<TableBodyCell><code class="text-xs">image/png</code></TableBodyCell>
						<TableBodyCell>Yes</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>JPG</TableBodyCell>
						<TableBodyCell><code class="text-xs">jpg</code></TableBodyCell>
						<TableBodyCell><code class="text-xs">image/jpeg</code></TableBodyCell>
						<TableBodyCell>Yes</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>WebP</TableBodyCell>
						<TableBodyCell><code class="text-xs">webp</code></TableBodyCell>
						<TableBodyCell><code class="text-xs">image/webp</code></TableBodyCell>
						<TableBodyCell>Yes</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>GIF</TableBodyCell>
						<TableBodyCell><code class="text-xs">gif</code></TableBodyCell>
						<TableBodyCell><code class="text-xs">image/gif</code></TableBodyCell>
						<TableBodyCell>No</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>BMP</TableBodyCell>
						<TableBodyCell><code class="text-xs">bmp</code></TableBodyCell>
						<TableBodyCell><code class="text-xs">image/bmp</code></TableBodyCell>
						<TableBodyCell>No</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>TIFF</TableBodyCell>
						<TableBodyCell><code class="text-xs">tiff</code></TableBodyCell>
						<TableBodyCell><code class="text-xs">image/tiff</code></TableBodyCell>
						<TableBodyCell>Yes</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>AVIF</TableBodyCell>
						<TableBodyCell><code class="text-xs">avif</code></TableBodyCell>
						<TableBodyCell><code class="text-xs">image/avif</code></TableBodyCell>
						<TableBodyCell>Yes</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>ICO</TableBodyCell>
						<TableBodyCell><code class="text-xs">ico</code></TableBodyCell>
						<TableBodyCell><code class="text-xs">image/x-icon</code></TableBodyCell>
						<TableBodyCell>No</TableBodyCell>
					</TableBodyRow>
				</TableBody>
			</Table>
		</Card>

		<!-- Rate Limits -->
		<Card size="xl" class="mb-6 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Rate Limits</h2>
			<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">Rate limits reset daily. Upgrade your plan for higher limits.</p>
			<Table striped class="mb-4">
				<TableHead>
					<TableHeadCell>Plan</TableHeadCell>
					<TableHeadCell>Daily Limit</TableHeadCell>
					<TableHeadCell>Max File Size</TableHeadCell>
					<TableHeadCell>API Keys</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow>
						<TableBodyCell>Free</TableBodyCell>
						<TableBodyCell>50</TableBodyCell>
						<TableBodyCell>10 MB</TableBodyCell>
						<TableBodyCell>1</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>Developer</TableBodyCell>
						<TableBodyCell>500</TableBodyCell>
						<TableBodyCell>25 MB</TableBodyCell>
						<TableBodyCell>3</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell>Business</TableBodyCell>
						<TableBodyCell>5,000</TableBodyCell>
						<TableBodyCell>50 MB</TableBodyCell>
						<TableBodyCell>10</TableBodyCell>
					</TableBodyRow>
				</TableBody>
			</Table>

			<p class="mb-2 text-sm font-medium text-gray-900 dark:text-white">Response Headers</p>
			<p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Successful conversion responses include rate limit headers:</p>
			<Table striped>
				<TableHead>
					<TableHeadCell>Header</TableHeadCell>
					<TableHeadCell>Description</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">X-RateLimit-Limit</code></TableBodyCell>
						<TableBodyCell>Your daily conversion limit</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">X-RateLimit-Remaining</code></TableBodyCell>
						<TableBodyCell>Conversions remaining today</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">X-RateLimit-Reset</code></TableBodyCell>
						<TableBodyCell>ISO 8601 timestamp when the limit resets</TableBodyCell>
					</TableBodyRow>
				</TableBody>
			</Table>
		</Card>

		<!-- Error Codes -->
		<Card size="xl" class="mb-6 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Error Codes</h2>
			<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
				Errors return JSON with an <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">error</code> field.
			</p>
			<Table striped>
				<TableHead>
					<TableHeadCell>Status</TableHeadCell>
					<TableHeadCell>Meaning</TableHeadCell>
					<TableHeadCell>Common Causes</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">400</code></TableBodyCell>
						<TableBodyCell>Bad Request</TableBodyCell>
						<TableBodyCell>Missing file, invalid format, invalid quality value, malformed form data</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">401</code></TableBodyCell>
						<TableBodyCell>Unauthorized</TableBodyCell>
						<TableBodyCell>Missing or invalid API token</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">413</code></TableBodyCell>
						<TableBodyCell>Payload Too Large</TableBodyCell>
						<TableBodyCell>File exceeds your plan's size limit</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">429</code></TableBodyCell>
						<TableBodyCell>Too Many Requests</TableBodyCell>
						<TableBodyCell>Daily conversion limit reached</TableBodyCell>
					</TableBodyRow>
					<TableBodyRow>
						<TableBodyCell><code class="text-xs">500</code></TableBodyCell>
						<TableBodyCell>Internal Server Error</TableBodyCell>
						<TableBodyCell>Conversion failed (corrupt file, unsupported input format)</TableBodyCell>
					</TableBodyRow>
				</TableBody>
			</Table>
			<div class="mt-3 overflow-x-auto rounded bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
				<pre>{`{
  "error": "Daily API conversion limit reached",
  "limit": 50,
  "resetAt": "2025-01-02T00:00:00.000Z"
}`}</pre>
			</div>
		</Card>

		<!-- Code Examples -->
		<Card size="xl" class="mb-6 p-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Code Examples</h2>

			<!-- curl -->
			<h3 class="mb-2 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">curl</h3>
			<div class="mb-6 overflow-x-auto rounded bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
				<pre>{`curl -X POST https://format.select/api/v1/convert \\
  -H "Authorization: Bearer ic_your_token_here" \\
  -F "file=@photo.png" \\
  -F "format=webp" \\
  -F "quality=80" \\
  -o photo.webp`}</pre>
			</div>

			<!-- JavaScript -->
			<h3 class="mb-2 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">JavaScript (fetch)</h3>
			<div class="mb-6 overflow-x-auto rounded bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
				<pre>{`const form = new FormData();
form.append("file", fileInput.files[0]);
form.append("format", "webp");
form.append("quality", "80");

const res = await fetch("https://format.select/api/v1/convert", {
  method: "POST",
  headers: { "Authorization": "Bearer ic_your_token_here" },
  body: form,
});

if (!res.ok) {
  const err = await res.json();
  throw new Error(err.error);
}

const blob = await res.blob();
// Use the converted image blob`}</pre>
			</div>

			<!-- Python -->
			<h3 class="mb-2 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Python (requests)</h3>
			<div class="overflow-x-auto rounded bg-gray-100 p-4 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
				<pre>{`import requests

url = "https://format.select/api/v1/convert"
headers = {"Authorization": "Bearer ic_your_token_here"}

with open("photo.png", "rb") as f:
    res = requests.post(url, headers=headers, files={
        "file": ("photo.png", f, "image/png"),
    }, data={
        "format": "webp",
        "quality": "80",
    })

res.raise_for_status()
with open("photo.webp", "wb") as out:
    out.write(res.content)`}</pre>
			</div>
		</Card>

		<p class="mt-6 text-center">
			<A href="/app" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">&larr; back</A>
		</p>
	</div>
</div>
