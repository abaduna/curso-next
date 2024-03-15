"use server"
import {z} from "zod"
import { Invoice } from "./definitions";
import { sql  } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };
const FormSchema  = z.object({
    id:z.string(),
    customerId:z.string({
        invalid_type_error: 'Please select a customer.',
      }),
    amount:z.coerce.number()
                    .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status:z.enum(["pending","paid"], {
        invalid_type_error: 'Please select an invoice status.',
      }),
    date:z.string()
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoices(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      })
    
       /*
        si hay un monton de se puede hacer
        Object.fromEntries(fromData.entries())
        */
        if (!validatedFields.success) {
            return {
              errors: validatedFields.error.flatten().fieldErrors,
              message: 'Missing Fields. Failed to Create Invoice.',
            };
          }
    const { customerId, amount, status } = validatedFields.data;     
    //creamo la fecha actual
    const [date] = new Date().toISOString().split("T") 
     //lo trandformamos a centavos   
    const amountCents = amount *100

    try {

    await sql` INSERT INTO invoices  (customer_id, amount, status, date) 
    VALUES (${customerId},${amountCents},${status},${date})
    `;
} catch (error) {
    
    return {
        message: 'Database Error: Failed to Create Invoice.',error,
      };
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;
   
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
} catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }
  export async function deleteInvoice(id:string){
    
    try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath("/dashboard/invoices")
} catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
    
  }