export const inquiryTemplate = ({ vendorName, senderName, senderEmail, message }: { vendorName: string, senderName: string, senderEmail: string, message: string }) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { margin-bottom: 30px; }
    .content { background: #f9fafb; padding: 30px; rounded: 16px; border: 1px solid #e5e7eb; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
    .button { background: #4F7575; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color: #4F7575;">New Inquiry for ${vendorName}</h2>
      <p>You have received a new inquiry from a potential property owner via HotelVendors.com.</p>
    </div>
    
    <div class="content">
      <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; font-style: italic; color: #4b5563;">"${message}"</p>
      
      <p>Please reply directly to the sender at <strong>${senderEmail}</strong> to discuss their requirements.</p>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} HotelVendors.com. All rights reserved.</p>
      <p>This inquiry was sent via the HotelVendors Marketplace.</p>
    </div>
  </div>
</body>
</html>
`;
