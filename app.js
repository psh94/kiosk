document.addEventListener("DOMContentLoaded", () => {
  // 초기 데이터
  let categories = [
    { id: "all",        name: "전체", builtin: true },
    { id: "korean",     name: "한식", builtin: false },
    { id: "japanese",   name: "일식", builtin: false },
    { id: "italian",    name: "양식", builtin: false },
    { id: "drinks",     name: "음료", builtin: false }
  ];
  
  let foods = [
    { id: "1", name: "비빔밥",  price: 12000, desc: "육회 들어감",  categoryId: "korean" },
    { id: "2", name: "피자",    price: 22000, desc: "치즈 폭탄",    categoryId: "italian" },
    { id: "3", name: "초밥",    price: 18000, desc: "모둠초밥",     categoryId: "japanese" }
  ];
  
  let orders = [];
  let selectedCategory = "all";

  // DOM 요소들
  const categoryList    = document.getElementById("categoryList");
  const menuList        = document.getElementById("menuList");
  const orderList       = document.getElementById("orderList");

  const totalAmount     = document.getElementById("totalAmount");
  
  const categoryPopup   = document.getElementById("categoryPopup");
  const foodPopup       = document.getElementById("foodPopup");

  // 카테고리 렌더링
  function renderCategories() {
    categoryList.innerHTML = "";
    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = `category-btn ${cat.id === selectedCategory ? 'active' : ''}`;
      btn.textContent = cat.name;
      btn.onclick = () => {
        selectedCategory = cat.id;
        // 모든 카테고리 버튼에서 active 클래스 제거
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        // 선택된 버튼에 active 클래스 추가
        btn.classList.add('active');
        renderFoods();
      };
      categoryList.appendChild(btn);

      // 삭제 버튼 (내장 카테고리가 아닌 경우에만)
      if (!cat.builtin && cat.id !== "all") {
        const delBtn = document.createElement("button");
        delBtn.className = "category-btn delete";
        delBtn.textContent = "삭제";
        delBtn.onclick = () => {
          if (confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) {
            // 해당 카테고리의 음식들도 함께 삭제
            foods = foods.filter(f => f.categoryId !== cat.id);
            categories = categories.filter(c => c.id !== cat.id);
            
            // 현재 선택된 카테고리가 삭제된 경우 전체로 변경
            if (selectedCategory === cat.id) {
              selectedCategory = "all";
            }
            
            renderCategories();
            renderFoods();
          }
        };
        categoryList.appendChild(delBtn);
      }
    });
  }

  // 음식 메뉴 렌더링
  function renderFoods() {
    menuList.innerHTML = "";
    
    const filteredFoods = selectedCategory === "all" 
      ? foods 
      : foods.filter(f => f.categoryId === selectedCategory);
    
    if (filteredFoods.length === 0) {
      menuList.innerHTML = '<p class="no-items">해당 카테고리에 음식이 없습니다.</p>';
      return;
    }

    filteredFoods.forEach(food => {
      const div = document.createElement("div");
      div.className = "food-item";
      div.innerHTML = `
        <h4>${food.name}</h4>
        <div class="price">${formatNumber(food.price)}원</div>
        <div class="description">${food.desc}</div>
        <div class="actions">
          <button class="btn-order">주문</button>
          <button class="btn-delete">삭제</button>
        </div>
      `;
      
      // 주문 버튼 이벤트
      div.querySelector(".btn-order").onclick = () => addOrder(food.id);
      
      // 삭제 버튼 이벤트
      div.querySelector(".btn-delete").onclick = () => {
        if (confirm(`"${food.name}"을(를) 삭제하시겠습니까?`)) {
          foods = foods.filter(f => f.id !== food.id);
          renderFoods();
        }
      };
      
      menuList.appendChild(div);
    });
  }

  // 주문 추가
  function addOrder(foodId) {
    const existingOrder = orders.find(o => o.foodId === foodId);
    
    if (existingOrder) {
      existingOrder.quantity++;
    } else {
      orders.push({ 
        foodId, 
        quantity: 1 
      });
    }
    
    renderOrders();
  }

  // 주문 목록 렌더링
  function renderOrders() {
    orderList.innerHTML = "";
    let total = 0;
    
    if (orders.length === 0) {
      orderList.innerHTML = '<p class="no-items">주문한 음식이 없습니다.</p>';
      totalAmount.textContent = "0";
      return;
    }

    orders.forEach(order => {
      const food = foods.find(f => f.id === order.foodId);
      if (!food) return;
      
      const orderItem = document.createElement("div");
      orderItem.className = "order-item";
      orderItem.innerHTML = `
        <div class="food-info">
          <div class="food-name">${food.name}</div>
          <div class="food-price">${formatNumber(food.price)}원</div>
        </div>
        <div class="quantity-controls">
          <button class="quantity-btn minus">-</button>
          <input type="number" class="quantity-input" value="${order.quantity}" min="1" max="99">
          <button class="quantity-btn plus">+</button>
        </div>
      `;
      
      const quantityInput = orderItem.querySelector(".quantity-input");
      const minusBtn = orderItem.querySelector(".minus");
      const plusBtn = orderItem.querySelector(".plus");
      
      // 수량 변경 이벤트
      quantityInput.onchange = (e) => {
        const newQuantity = parseInt(e.target.value) || 1;
        if (newQuantity < 1) {
          e.target.value = 1;
          order.quantity = 1;
        } else {
          order.quantity = newQuantity;
        }
        renderOrders();
      };
      
      // 마이너스 버튼
      minusBtn.onclick = () => {
        if (order.quantity > 1) {
          order.quantity--;
          quantityInput.value = order.quantity;
          renderOrders();
        }
      };
      
      // 플러스 버튼
      plusBtn.onclick = () => {
        if (order.quantity < 99) {
          order.quantity++;
          quantityInput.value = order.quantity;
          renderOrders();
        }
      };
      
      orderList.appendChild(orderItem);
      total += food.price * order.quantity;
    });
    
    totalAmount.textContent = formatNumber(total);
  }

  // 카테고리 추가 팝업
  document.getElementById("addCategoryBtn").onclick = () => {
    document.getElementById("categoryName").value = "";
    categoryPopup.style.display = "block";
  };

  // 메뉴 추가 팝업
  document.getElementById("addFoodBtn").onclick = () => {
    const select = document.getElementById("foodCategory");
    select.innerHTML = '<option value="">카테고리를 선택하세요</option>';
    
    // 내장 카테고리가 아닌 것들만 표시
    categories.filter(c => !c.builtin && c.id !== "all")
      .forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    
    document.getElementById("foodName").value = "";
    document.getElementById("foodPrice").value = "";
    document.getElementById("foodDesc").value = "";
    foodPopup.style.display = "block";
  };

  // 카테고리 저장
  document.getElementById("saveCategoryBtn").onclick = () => {
    const name = document.getElementById("categoryName").value.trim();
    if (name) {
      const newCategory = {
        id: Date.now().toString(),
        name: name,
        builtin: false
      };
      categories.push(newCategory);
      renderCategories();
      categoryPopup.style.display = "none";
    } else {
      alert("카테고리명을 입력해주세요.");
    }
  };

  // 메뉴 저장
  document.getElementById("saveFoodBtn").onclick = () => {
    const name = document.getElementById("foodName").value.trim();
    const price = parseInt(document.getElementById("foodPrice").value) || 0;
    const desc = document.getElementById("foodDesc").value.trim();
    const categoryId = document.getElementById("foodCategory").value;
    
    if (!name) {
      alert("음식명을 입력해주세요.");
      return;
    }
    
    if (!categoryId) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    
    if (price <= 0) {
      alert("올바른 가격을 입력해주세요.");
      return;
    }
    
    const newFood = {
      id: Date.now().toString(),
      name: name,
      price: price,
      desc: desc,
      categoryId: categoryId
    };
    
    foods.push(newFood);
    renderFoods();
    foodPopup.style.display = "none";
  };

  // 팝업 닫기
  document.querySelectorAll(".closePopup").forEach(btn => {
    btn.onclick = () => {
      btn.closest(".popup").style.display = "none";
    };
  });

  // 팝업 외부 클릭 시 닫기
  document.querySelectorAll(".popup").forEach(popup => {
    popup.onclick = (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
      }
    };
  });

  // 주문 초기화
  document.getElementById("resetOrderBtn").onclick = () => {
    if (orders.length > 0 && confirm("주문을 초기화하시겠습니까?")) {
      orders = [];
      renderOrders();
    }
  };

  // ESC 키로 팝업 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".popup").forEach(popup => {
        popup.style.display = "none";
      });
    }
  });

  // 초기 렌더링
  renderCategories();
  renderFoods();
  renderOrders();
});
