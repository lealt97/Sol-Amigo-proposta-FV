with open('src/services/profileService.ts', 'r') as f:
    content = f.read()

target = """  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Profile;
  },"""

replacement = """  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      // Create an empty profile if one doesn't exist
      const defaultProfile = {
        id: userId,
        name: '',
        company_name: '',
      };
      
      const { data: newData, error: insertError } = await supabase
        .from('profiles')
        .insert([defaultProfile])
        .select()
        .single();
        
      if (insertError) {
        console.warn('Could not create default profile, returning empty object:', insertError);
        return defaultProfile as Profile;
      }
      return newData as Profile;
    }

    return data as Profile;
  },"""

content = content.replace(target, replacement)

with open('src/services/profileService.ts', 'w') as f:
    f.write(content)
