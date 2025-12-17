import { supabase } from './supabase';

// 检查用户是否已登录且是管理员
export async function checkAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // 检查用户邮箱是否在管理员白名单中
  const { data: admin, error: adminError } = await supabase
    .from('gb_admins')
    .select('*')
    .eq('email', user.email)
    .single();

  if (adminError || !admin) {
    // 不是管理员
    return null;
  }

  return user;
}

// 退出登录
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// 获取当前session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}
