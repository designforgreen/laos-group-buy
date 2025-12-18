import { supabase } from './supabase';

/**
 * 上传图片到 Supabase Storage
 * @param file 图片文件
 * @param bucket 存储桶名称
 * @param folder 文件夹路径（可选）
 * @returns 公开URL
 */
export async function uploadImage(
  file: File,
  bucket: string = 'group-buy',
  folder?: string
): Promise<string> {
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('请上传 JPG、PNG 或 WebP 格式的图片');
  }

  // 验证文件大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('图片大小不能超过 5MB');
  }

  // 生成唯一文件名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const ext = file.name.split('.').pop();
  const fileName = `${timestamp}-${randomStr}.${ext}`;

  // 构建文件路径
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  // 上传文件
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error('上传失败：' + error.message);
  }

  // 获取公开URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * 删除图片
 * @param url 图片URL
 * @param bucket 存储桶名称
 */
export async function deleteImage(
  url: string,
  bucket: string = 'group-buy'
): Promise<void> {
  try {
    // 从URL中提取文件路径
    const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) {
      throw new Error('无效的图片URL');
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error('删除失败：' + error.message);
    }
  } catch (error) {
    console.error('Delete image error:', error);
    // 不抛出错误，避免阻塞其他操作
  }
}
