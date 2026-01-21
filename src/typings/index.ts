export interface CommonConfig {
  /**
   * 过滤要处理的文件路径
   * @param path 文件路径
   * @returns 是否保留
   */
  pathFilter?: (path: string) => boolean;

  /** 默认工作路径 */
  defaultPath?: string;
  /**
   * 生成输出文件路径
   * @param filePath 文件路径信息
   * @returns 输出文件的决定路径
   */
  pathGenerator?: (filePath: FilePathInfo) => string;

  [key: string]: any;
}

export interface FilePathInfo {
  /** 文件路径 */
  dir: string;
  /** 文件名 */
  fileName: string;
  /** 文件名（不包含扩展名） */
  fileNameWithoutExt: string;
  /** 文件扩展名 */
  fileExtension: string;
}
