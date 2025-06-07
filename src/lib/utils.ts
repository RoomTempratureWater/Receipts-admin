import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
//import * as argon2 from "argon2";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



//export async function hash_pass(pass: String) {
//  const hash = await argon2.hash(pass);
//  //console.log(hash);
//  return hash
//}
//
//export async function hash_verify(hash: String, pass: String) {
//  return await argon2.verify(hash, pass);
//}


//hash_pass("test");



