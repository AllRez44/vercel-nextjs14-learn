'use server';

import { z } from 'zod';
import { sql } from  '@vercel/postgres'
import { revalidatePath } from "next/cache";
import {redirect} from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // Test it out:
  console.log('customerId: ' + customerId);
  console.log('amount: ' + amount);
  console.log('amountInCents: ' + amountInCents);
  console.log('status: ' + status);
  console.log('date: ' + date);
  // DB Query
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `
    console.log('Invoice created successfully')
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice created successfully' }
  }
  catch (error)
  {
    console.log('Database error:', error)

    return {
      message: `Failed to create invoice`
    }
  }
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
  // const date = new Date().toISOString().split('T')[0];
  // Test it out:
  console.log('customerId: ' + customerId);
  console.log('amount: ' + amount);
  console.log('amountInCents: ' + amountInCents);
  console.log('status: ' + status);
  // console.log('date: ' + date);
  // DB Query
  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `
    console.log(`Invoice ${id} updated successfully`)
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice updated successfully' }
  }
  catch (error)
  {
    console.log('Database error:', error)
    console.log('Invoice: ', id)
    return {
      message: `Failed to update invoice`
    }
  }
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // const date = new Date().toISOString().split('T')[0];
  // Test it out:
  // DB Query
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`
    console.log(`Invoice ${id} deleted successfully`)
    revalidatePath('/dashboard/invoices');
    return { message: 'Invoice delete successfully' }
  }
  catch (error)
  {
    console.log('Database error:', error);
    console.log('Invoice: ', id)
    return {
     message: `Failed to delete invoice`,
    }
  }
}
