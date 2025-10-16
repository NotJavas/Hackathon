document.addEventListener('DOMContentLoaded', () => {
            const isSignUp = {
                value: false
            };

            const nameField = document.getElementById('name-field');
            const formTitle = document.getElementById('form-title');
            const formDescription = document.getElementById('form-description');
            const submitButton = document.getElementById('submit-button');
            const switchFormText = document.getElementById('switch-form-text');
            const switchFormButton = document.getElementById('switch-form-button');
            const loginForm = document.getElementById('login-form');

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            const toastContainer = document.getElementById('toast-container');


            function showToast(message, type = 'info') {
                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                toast.textContent = message;
                toastContainer.appendChild(toast);

                setTimeout(() => {
                    toast.classList.add('show');
                }, 100);

                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        toast.remove();
                    }, 300);
                }, 3000);
            }
            
                // Al perder el foco (click fuera), borrar contenido
                emailInput.addEventListener('blur', () => {
                emailInput.value = '';
                // (Opcional) disparar 'input' para que otras lógicas reaccionen
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                });    
                
                passwordInput.addEventListener('blur', () => {
                passwordInput.value = '';
                // (Opcional) disparar 'input' para que otras lógicas reaccionen
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                }); 

            function toggleForm() {
                isSignUp.value = !isSignUp.value;

                if (isSignUp.value) {
                    nameField.classList.remove('hidden');
                    formTitle.textContent = 'Crear una cuenta';
                    formDescription.textContent = 'Regístrate para empezar a organizar tu vida académica';
                    submitButton.textContent = 'Registrarse';
                    switchFormText.textContent = '¿Ya tienes una cuenta?';
                    switchFormButton.textContent = 'Iniciar sesión';
                } else {
                    nameField.classList.add('hidden');
                    formTitle.textContent = 'Bienvenido de vuelta';
                    formDescription.textContent = 'Inicia sesión en tu cuenta para continuar';
                    submitButton.textContent = 'Iniciar sesión';
                    switchFormText.textContent = '¿No tienes una cuenta?';
                    switchFormButton.textContent = 'Crear una cuenta';
                }
            }


            switchFormButton.addEventListener('click', toggleForm);

            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const email = emailInput.value;
                const password = passwordInput.value;
                const name = nameInput.value;

                if (!email.trim()) {
                    showToast('Por favor, introduce tu correo electrónico', 'error');
                    return;
                }

                if (!password.trim()) {
                    showToast('Por favor, introduce tu contraseña', 'error');
                    return;
                }

                if (isSignUp.value && !name.trim()) {
                    showToast('Por favor, introduce tu nombre', 'error');
                    return;
                }

                const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
                if (!emailRegex.test(email)) {
                    showToast('Por favor, introduce un correo electrónico válido', 'error');
                    return;
                }

                if (isSignUp.value) {
                    showToast('¡Cuenta creada con éxito!', 'success');
                } else {
                    showToast('¡Bienvenido de vuelta!', 'success');
                }
                
                // Redirect to the main page after a short delay
                setTimeout(() => {
                    window.location.href = './landing.html';
                }, 1500);
            });
        });