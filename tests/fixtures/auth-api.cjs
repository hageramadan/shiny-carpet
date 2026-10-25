// Local-only auth provider used by the browser integration check. It sends no SMS.
const http = require("node:http");
const accounts = new Map([
  [
    "+201012345678",
    {
      id: 4,
      name: "حساب الاختبار",
      phone: "1012345678",
      country_code: "+20",
      is_active: false,
    },
  ],
]);
const tokens = new Set();
const requests = [];
const json = (response, status, body) => {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
};
const success = (data, message = "تمت العملية بنجاح") => ({
  result: true,
  errNum: 200,
  message,
  data,
});
const server = http.createServer(async (request, response) => {
  if (request.url === "/__reset" && request.method === "POST") {
    accounts.clear();
    accounts.set("+201012345678", {
      id: 4,
      name: "حساب الاختبار",
      phone: "1012345678",
      country_code: "+20",
      is_active: false,
    });
    tokens.clear();
    requests.length = 0;
    return json(response, 200, { fixture: true });
  }
  if (request.url === "/__requests") return json(response, 200, requests);
  try {
    let text = "";
    for await (const chunk of request) text += chunk;
    const input = JSON.parse(text || "{}");
    const action = request.url.split("/").pop();
    const key = input.country_code + input.phone;
    requests.push({
      action,
      input,
      arabic: request.headers["accept-language"] === "ar",
      authorized: tokens.has(request.headers.authorization?.replace(/^Bearer /, "")),
    });
    if (action === "register") {
      if (accounts.has(key))
        return json(response, 422, {
          result: false,
          errNum: 422,
          message: "رقم الهاتف مسجل بالفعل",
        });
      const user = {
        id: 6,
        name: input.name,
        phone: input.phone,
        country_code: input.country_code,
        is_active: false,
      };
      accounts.set(key, user);
      return json(response, 200, success({ user }, "تم إنشاء الحساب وإرسال رمز التحقق"));
    }
    if (action === "login" && !accounts.has(key))
      return json(response, 404, {
        result: false,
        errNum: 404,
        message: "رقم الهاتف غير مسجل",
      });
    if (action === "login")
      return json(response, 200, {
        status: "pending_verification",
        message: "تم إرسال رمز التحقق",
        user: accounts.get(key),
      });
    if (action === "resend")
      return json(response, 200, success([], "تمت إعادة إرسال رمز التحقق"));
    if (action === "verify") {
      if (input.code !== "123456")
        return json(response, 200, {
          result: false,
          errNum: 422,
          message: "الرمز غير صحيح",
          data: [],
        });
      const user = accounts.get(key);
      if (!user)
        return json(response, 404, { result: false, message: "الحساب غير موجود" });
      user.is_active = true;
      const token = `fixture-only-${user.id}`;
      tokens.add(token);
      await new Promise((resolve) => setTimeout(resolve, 150));
      return json(response, 200, success({ user, token }, "تم تسجيل الدخول"));
    }
    if (action === "logout") {
      const token = request.headers.authorization?.replace(/^Bearer /, "");
      if (!tokens.has(token))
        return json(response, 401, { result: false, message: "Unauthenticated" });
      tokens.delete(token);
      return json(response, 200, success([], "تم تسجيل الخروج"));
    }
    return json(response, 404, { result: false });
  } catch {
    return json(response, 400, { result: false, message: "Invalid fixture request" });
  }
});
server.listen(4109, "127.0.0.1", () =>
  process.stdout.write("Local authentication fixture ready on 4109\n"),
);
