    document.addEventListener('DOMContentLoaded', function() {
      const form = document.getElementById('requestForm');
      const submitBtn = document.getElementById('submitBtn');
      const buttonText = document.getElementById('buttonText');
      const loadingSpinner = document.getElementById('loadingSpinner');
      const alertError = document.getElementById('alertError');
      const errorMessage = document.getElementById('errorMessage');
      const successOverlay = document.getElementById('successOverlay');
      const pesanInput = document.getElementById('pesan');
      const charCount = document.getElementById('charCount');
      
      pesanInput.addEventListener('input', function() {
        charCount.textContent = this.value.length;
        if (this.value.length > 500) {
          charCount.classList.add('text-red-500');
        } else {
          charCount.classList.remove('text-red-500');
        }
      });
      
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const pesan = pesanInput.value.trim();
        
        if (!pesan) {
          showError("Pesan tidak boleh kosong!");
          return;
        }
        
        if (pesan.length > 500) {
          showError("Pesan maksimal 500 karakter!");
          return;
        }
        
        submitBtn.disabled = true;
        buttonText.textContent = "Mengirim...";
        loadingSpinner.classList.remove('hidden');
        
        const waktu = new Date().toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // In a real app, you would use:
          // const res = await fetch("/api/request", {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({ pesan, waktu })
          // });
          
          // For demo purposes, we'll assume success
          showSuccess();
          
        } catch (error) {
          showError("Terjadi kesalahan jaringan!");
        } finally {
          submitBtn.disabled = false;
          buttonText.textContent = "Kirim Pesan";
          loadingSpinner.classList.add('hidden');
        }
      });
      
      function showError(message) {
        errorMessage.textContent = message;
        alertError.classList.remove('hidden');
        
        setTimeout(() => {
          alertError.classList.add('hidden');
        }, 5000);
      }
      
      function showSuccess() {
        successOverlay.classList.add('opacity-100');
        successOverlay.classList.remove('pointer-events-none');
        
        setTimeout(() => {
          successOverlay.classList.remove('opacity-100');
          successOverlay.classList.add('pointer-events-none');
          form.reset();
          charCount.textContent = '0';
        }, 3000);
      }
    });