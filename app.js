document.addEventListener("DOMContentLoaded", () => {
  // 초기 데이터
  let categories = [
    { id: "all", name: "전체"}
  ];
  
  let foods = [];
  let orders = [];
  let selectedCategory = "all";
  let dateNowValue = "";
  let randomNumber = "";
  let randomId = "";
  let data = [];
  let menuData = [];


  // DOM 요소들
  const categoryList    = document.getElementById("categoryList");
  const menuList        = document.getElementById("menuList");
  const orderList       = document.getElementById("orderList");

  const totalAmount     = document.getElementById("totalAmount");
  
  const categoryPopup   = document.getElementById("categoryPopup");
  const foodPopup       = document.getElementById("foodPopup");

  function formatNumber(num) {
    return num.toLocaleString("ko-KR");
  }
  function makeRandomId () {
    dateNowValue = Date.now();
    randomNumber = parseInt(Math.random()*10000);
    randomId = dateNowValue + randomNumber;
  }
  function popupStyleDisplayBlock(popup){
    popup.style.display = "block";
  }
  function popupStyleDisplayNone(popup){
    popup.style.display = "none";
  }


  //-------------------------------------------------------------------------------
  const API_BASE = 'http://localhost:8080';
  //-------------------------------------------------------------------------------
  // GET 요청
  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
    } catch (err) {
      console.error("호출 실패:", err);
    }
  }

  // POST 요청
  async function addCategory(addedData) {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(addedData)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      console.error("POST 실패:", err);
    }
  }

  // DELETE 요청
  async function deleteCategory(id) {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(id)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      console.error("POST 실패:", err);
    }
  }
  //-------------------------------------------------------------------------------
  // GET 요청
  async function loadMenu() {
    try {
      const res = await fetch(`${API_BASE}/menu`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      menuData = await res.json();
    } catch (err) {
      console.error("호출 실패:", err);
    }
  }

  // POST 요청
  async function addMenu(addedData) {
    try {
      const res = await fetch(`${API_BASE}/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(addedData)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      console.error("POST 실패:", err);
    }
  }
  

  // DELETE 요청
  async function deleteMenu(id) {
    try {
      const res = await fetch(`${API_BASE}/menu`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(id)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      console.error("POST 실패:", err);
    }
  }
  //-------------------------------------------------------------------------------

  // POST 요청
  async function addOrder(newOrder) {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newOrder)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      addOrderItem(newOrder.id);
    } catch (err) {
      console.error("POST 실패:", err);
    }
  }
  //-------------------------------------------------------------------------------
  // POST 요청
  async function addOrderItem(newOrderId) {
    orders.forEach(async order => {
      makeRandomId();
      let newOrderItem = {
        id: randomId,
        menuId: order.foodId,
        quantity: order.quantity,
        orderId: newOrderId
      }

      try {
        const res = await fetch(`${API_BASE}/orderItems`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newOrderItem)
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
      } catch (err) {
        console.error("POST 실패:", err);
      }
    });
    


    
  }
  //-------------------------------------------------------------------------------

  // 카테고리 렌더링
  async function renderCategories() {
    categories = [
      { id: "all", name: "전체"}
    ];

    await loadCategories();
    data.forEach(d => {
      categories.push(d);
    });

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
      if (cat.id !== "all") {
        const delBtn = document.createElement("button");
        delBtn.className = "category-btn delete";
        delBtn.textContent = "삭제";
        delBtn.onclick = () => {
          if (confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`)) {
            // 해당 카테고리의 음식들도 함께 삭제
            foods = foods.filter(f => f.categoryId !== cat.id);
            deleteCategory(cat.id);
            
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
  async function renderFoods() {
    foods = [];
    await loadMenu();
    menuData.forEach(d => {
      foods.push(d);
    });
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
        <div class="description">
          ${food.description !== (undefined || null) ? food.description : ""}
        </div>
        <div class="actions">
          <button class="btn-order">주문</button>
          <button class="btn-delete">삭제</button>
        </div>
      `;
      
      // 주문 버튼 이벤트
      div.querySelector(".btn-order").onclick = () => updateOrderList(food.id);
      
      // 삭제 버튼 이벤트
      div.querySelector(".btn-delete").onclick = async () => {
        if (confirm(`"${food.name}"을(를) 삭제하시겠습니까?`)) {
          await deleteMenu(food.id);
          renderFoods();
        }
      };
      
      menuList.appendChild(div);
    });
  }

  // 주문 추가
  function updateOrderList(foodId) {
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

      total += food.price * order.quantity;
      totalAmount.textContent = formatNumber(total);
      orderList.appendChild(orderItem);

      // --------- 주문 수량, 합계란 ---------------
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
        renderTotalPrice();
      };
      
      // 마이너스 버튼
      minusBtn.onclick = () => {
        if (order.quantity > 1) {
          order.quantity--;
          quantityInput.value = order.quantity;
          renderTotalPrice();
        }
      };
      
      // 플러스 버튼
      plusBtn.onclick = () => {
        if (order.quantity < 99) {
          order.quantity++;
          quantityInput.value = order.quantity;
          renderTotalPrice();
        }
      };      
    });
  }

  function renderTotalPrice(){
    let total = 0;
    orders.forEach(order => {
      const food = foods.find(f => f.id === order.foodId);
      total += food.price * order.quantity;
      totalAmount.textContent = formatNumber(total);
    });
  }

  // 카테고리 추가 팝업
  document.getElementById("addCategoryBtn").onclick = () => {
    document.getElementById("categoryName").value = "";
    popupStyleDisplayBlock(categoryPopup);
  };

  // 메뉴 추가 팝업
  document.getElementById("addFoodBtn").onclick = () => {
    const select = document.getElementById("foodCategory");
    select.innerHTML = '<option value="">카테고리를 선택하시오.</option>';
    
    // 내장 카테고리가 아닌 것들만 표시
    categories.filter(c => c.id !== "all")
      .forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        option.className = "categoryOption";
        select.appendChild(option);
      });
    
    const categoryOptions = document.querySelectorAll(".categoryOption");
    categoryOptions.forEach(catop => {
      if(catop.value === selectedCategory.toString()){
        document.querySelector("#foodCategory").value = catop.value;
      }
    });
    
    document.getElementById("foodName").value = "";
    document.getElementById("foodPrice").value = "";
    document.getElementById("foodDesc").value = "";
    popupStyleDisplayBlock(foodPopup);
  };

  // 카테고리 저장
  document.getElementById("saveCategoryBtn").onclick = async () => {
    const name = document.getElementById("categoryName").value.trim();
    makeRandomId();
    if (name) {
      newCategory = {
        id: randomId,
        name: name
      };

      
      await addCategory(newCategory);
      await renderCategories();
      popupStyleDisplayNone(categoryPopup);
    } else {
      alert("카테고리명을 입력해주세요.");
    }
  };

  // 메뉴 저장
  document.getElementById("saveFoodBtn").onclick = async () => {
    const name = document.getElementById("foodName").value.trim();
    const price = parseInt(document.getElementById("foodPrice").value) || 0;
    const desc = document.getElementById("foodDesc").value.trim();
    const categoryId = document.getElementById("foodCategory").value;
    await makeRandomId();

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
      id: randomId,
      name: name,
      price: price,
      description: desc,
      categoryId: categoryId
    };
    
    await addMenu(newFood);

    renderFoods();
    popupStyleDisplayNone(foodPopup);
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
        popupStyleDisplayNone(popup);
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

  //주문하기
  document.getElementById("orderBtn").onclick = async () => {
    if(confirm("주문하시겠습니까?")){
      
      await makeRandomId();
      let newOrder = {
        id: randomId,
        totalPrice: 0
      }
      await addOrder(newOrder);
    }
  }

  // ESC 키로 팝업 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".popup").forEach(popup => {
        popupStyleDisplayNone(popup);
      });
    }
  });

  // 초기 렌더링
  renderCategories();
  renderFoods();
  renderOrders();
});
