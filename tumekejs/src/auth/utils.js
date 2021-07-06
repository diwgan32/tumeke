export const virgilIdGenerator = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let str = ""
  for (let i = 0; i < 28; i++) {
    str += chars[Math.floor(Math.random() * 28)]
  }
  return str;
}