import { supabase } from "../../../shared/lib/supabase";

export type CallbackRow = {
  id:         string;
  name:       string;
  phone:      string;
  closed:     boolean;
  created_at: string;
};

export async function submitCallback(name: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from("callbacks")
    .insert({ name: name.trim(), phone: phone.trim() });
  if (error) throw new Error(error.message);
}
