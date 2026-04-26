import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

/**
 * Get full path of a blog post
 * @param id - id of the blog post (aka slug)
 * @param filePath - full file path to the blog post
 * @param includeBase - whether to include `/posts` in the return value
 * @returns blog post path
 */
export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true
) {
  const pathSegments = filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter(path => path !== "") // filter out empty segments
    .filter(path => !path.startsWith("_")) // exclude directories starting with an underscore
    .slice(0, -1) // remove the last segment (filename)
    .map(segment => slugifyStr(segment)); // slugify each path segment

  const basePath = includeBase ? "/posts" : "";

  // Ensure the id contains only the slug, not a directory prefix
  const blogId = id.split("/");
  const slug = blogId.length > 0 ? blogId.slice(-1) : blogId;

  // If not inside a subdirectory, return the path directly
  if (!pathSegments || pathSegments.length < 1) {
    return [basePath, slug].join("/");
  }

  return [basePath, ...pathSegments, slug].join("/");
}
